import crypto from 'crypto';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { DAILY_TIME_SLOTS, SERVICE_PACKAGES } from './src/data/groviadsProfile';
import {
  calculateFeeBreakdown,
  detectCardBrand,
  getAvailableSlotsForDate,
  validateAppointmentForm,
  validateCardPayment,
  validateEmail,
  validateLeadForm,
} from './src/utils/validation';
import { db, ensureAdvisorKeyAndSeedData } from './server/db';
import {
  normalizeGeminiError,
  runMapsGroundedQuery,
  runMultiTurnChat,
  runSearchGroundedQuery,
  type ChatRolePreset,
  type FreeChatModel,
} from './server/gemini';
import { dispatchOwnerNotification, getNotificationConfig } from './server/mailer';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  await ensureAdvisorKeyAndSeedData();

  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'groviads-platform' });
  });

  app.get('/api/bootstrap', (req, res) => {
    const clientId = String(req.query.clientId || '').trim();
    const advisorRow = db
      .prepare('SELECT public_key_jwk, fingerprint FROM advisor_keys WHERE id = ?')
      .get('groviads-desk-primary') as
      | { public_key_jwk: string; fingerprint: string }
      | undefined;

    let visitor: Record<string, unknown> | null = null;
    if (clientId) {
      const existing = db
        .prepare('SELECT * FROM visitor_profiles WHERE client_id = ?')
        .get(clientId) as Record<string, unknown> | undefined;
      if (existing) {
        db.prepare(
          'UPDATE visitor_profiles SET visit_count = visit_count + 1, last_seen_at = ? WHERE client_id = ?'
        ).run(new Date().toISOString(), clientId);
        visitor = { ...existing, visit_count: Number(existing.visit_count || 1) + 1 };
      } else {
        const now = new Date().toISOString();
        db.prepare(
          'INSERT INTO visitor_profiles (client_id, visit_count, has_booked_free_consult, last_seen_at, created_at) VALUES (?, 1, 0, ?, ?)'
        ).run(clientId, now, now);
        visitor = {
          client_id: clientId,
          visit_count: 1,
          has_booked_free_consult: 0,
        };
      }
    }

    const cfg = getNotificationConfig();
    const mapsApiKey =
      process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
    res.json({
      advisorPublicKey: advisorRow ? JSON.parse(advisorRow.public_key_jwk) : null,
      advisorFingerprint: advisorRow?.fingerprint || null,
      visitor,
      notificationTarget: cfg.ownerEmail,
      smtpConfigured: cfg.smtpConfigured,
      mapsApiKey,
    });
  });

  app.post('/api/visitors/identify', async (req, res) => {
    const { clientId, name, email, country, phone } = req.body || {};
    if (!clientId || !email || !validateEmail(String(email))) {
      return res.status(400).json({ error: 'Valid clientId and email are required.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const now = new Date().toISOString();

    const existingBooking = db
      .prepare(
        "SELECT COUNT(*) as c FROM appointments WHERE LOWER(email) = ? AND status != 'cancelled'"
      )
      .get(cleanEmail) as { c: number };

    const existingVisitor = db
      .prepare('SELECT * FROM visitor_profiles WHERE client_id = ?')
      .get(String(clientId)) as { visit_count?: number } | undefined;

    if (existingVisitor) {
      db.prepare(
        `UPDATE visitor_profiles SET name = ?, email = ?, country = ?, phone = ?, has_booked_free_consult = ?, last_seen_at = ? WHERE client_id = ?`
      ).run(
        name ? String(name).trim() : null,
        cleanEmail,
        country ? String(country).trim() : null,
        phone ? String(phone).trim() : null,
        existingBooking.c > 0 ? 1 : 0,
        now,
        String(clientId)
      );
    } else {
      db.prepare(
        `INSERT INTO visitor_profiles (client_id, name, email, country, phone, visit_count, has_booked_free_consult, last_seen_at, created_at)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`
      ).run(
        String(clientId),
        name ? String(name).trim() : null,
        cleanEmail,
        country ? String(country).trim() : null,
        phone ? String(phone).trim() : null,
        existingBooking.c > 0 ? 1 : 0,
        now,
        now
      );
    }

    if (existingBooking.c === 0) {
      await dispatchOwnerNotification({
        eventType: 'returning_user_alert',
        clientEmail: cleanEmail,
        subject: `[GROVIADS Existing User Active] ${name || cleanEmail} — Invite Free Consultation`,
        bodyText: `Existing/identified user ${name || 'Visitor'} (${cleanEmail}) is active on the platform and has not yet scheduled their complimentary 30-minute consultation.`,
      });
    }

    const updated = db
      .prepare('SELECT * FROM visitor_profiles WHERE client_id = ?')
      .get(String(clientId));
    res.json({ visitor: updated, hasBookedConsultation: existingBooking.c > 0 });
  });

  // Availability & Appointments
  app.get('/api/appointments/availability', (req, res) => {
    const date = String(req.query.date || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Query parameter date (YYYY-MM-DD) is required.' });
    }
    const rows = db
      .prepare(
        'SELECT appointment_date as appointmentDate, appointment_time as appointmentTime, status FROM appointments WHERE appointment_date = ?'
      )
      .all(date) as { appointmentDate: string; appointmentTime: string; status: string }[];
    const slots = getAvailableSlotsForDate(DAILY_TIME_SLOTS, rows, date);
    res.json({ date, slots });
  });

  app.get('/api/appointments', (req, res) => {
    const email = String(req.query.email || '').trim().toLowerCase();
    const clientId = String(req.query.clientId || '').trim();
    if (email || clientId) {
      const rows = db
        .prepare(
          'SELECT * FROM appointments WHERE LOWER(email) = ? OR client_id = ? ORDER BY appointment_date ASC, appointment_time ASC'
        )
        .all(email, clientId);
      return res.json({ appointments: rows });
    }
    const rows = db
      .prepare('SELECT * FROM appointments ORDER BY created_at DESC')
      .all();
    res.json({ appointments: rows });
  });

  app.post('/api/appointments', async (req, res) => {
    const body = req.body || {};
    const validation = validateAppointmentForm({
      name: String(body.name || ''),
      email: String(body.email || ''),
      phone: String(body.phone || ''),
      country: String(body.country || 'Worldwide'),
      serviceInterest: String(body.serviceInterest || ''),
      packageId: String(body.packageId || 'free-consultation'),
      appointmentDate: String(body.appointmentDate || ''),
      appointmentTime: String(body.appointmentTime || ''),
      timezone: String(body.timezone || 'UTC (GMT+0)'),
      notes: String(body.notes || ''),
    });

    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', errors: validation.errors });
    }

    const conflict = db
      .prepare(
        "SELECT id FROM appointments WHERE appointment_date = ? AND appointment_time = ? AND status != 'cancelled'"
      )
      .get(String(body.appointmentDate), String(body.appointmentTime));

    if (conflict) {
      return res.status(409).json({
        error: 'This time slot was just reserved. Please select another open slot.',
      });
    }

    const id = `bk_${crypto.randomBytes(5).toString('hex')}`;
    const now = new Date().toISOString();
    const clientId = String(body.clientId || `cli_${crypto.randomBytes(4).toString('hex')}`);
    const cleanEmail = String(body.email).trim().toLowerCase();

    db.prepare(
      `INSERT INTO appointments (id, client_id, name, email, phone, country, service_interest, package_id, appointment_date, appointment_time, timezone, notes, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)`
    ).run(
      id,
      clientId,
      String(body.name).trim(),
      cleanEmail,
      String(body.phone).trim(),
      String(body.country || 'Worldwide').trim(),
      String(body.serviceInterest).trim(),
      String(body.packageId || 'free-consultation').trim(),
      String(body.appointmentDate).trim(),
      String(body.appointmentTime).trim(),
      String(body.timezone).trim(),
      body.notes ? String(body.notes).trim() : null,
      now
    );

    db.prepare(
      `INSERT INTO visitor_profiles (client_id, name, email, country, phone, visit_count, has_booked_free_consult, last_seen_at, created_at)
       VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?)
       ON CONFLICT(client_id) DO UPDATE SET name=excluded.name, email=excluded.email, country=excluded.country, phone=excluded.phone, has_booked_free_consult=1, last_seen_at=excluded.last_seen_at`
    ).run(
      clientId,
      String(body.name).trim(),
      cleanEmail,
      String(body.country || 'Worldwide').trim(),
      String(body.phone).trim(),
      now,
      now
    );

    db.prepare(
      'INSERT INTO analytics_events (id, client_id, event_type, section, label, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      `ev_${crypto.randomBytes(5).toString('hex')}`,
      clientId,
      'booking_completed',
      'scheduler',
      `${body.serviceInterest} (${body.appointmentDate} ${body.appointmentTime})`,
      JSON.stringify({ appointmentId: id, packageId: body.packageId || 'free-consultation' }),
      now
    );

    const notification = await dispatchOwnerNotification({
      eventType: 'appointment_booked',
      clientEmail: cleanEmail,
      subject: `[GROVIADS Booking] Consultation Confirmed — ${String(body.name).trim()}`,
      bodyText: [
        `New consultation booked on GROVIADS:`,
        `Booking ID: ${id}`,
        `Client: ${String(body.name).trim()}`,
        `Email: ${cleanEmail}`,
        `Phone / WhatsApp: ${String(body.phone).trim()}`,
        `Country: ${String(body.country || 'Worldwide').trim()}`,
        `Service Focus: ${String(body.serviceInterest).trim()}`,
        `Schedule: ${String(body.appointmentDate)} at ${String(body.appointmentTime)} (${String(body.timezone)})`,
        body.notes ? `Notes: ${String(body.notes).trim()}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    });

    const created = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    res.status(201).json({ appointment: created, notification });
  });

  app.patch('/api/appointments/:id', async (req, res) => {
    const { id } = req.params;
    const { status, appointmentDate, appointmentTime } = req.body || {};
    const existing = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined;
    if (!existing) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }
    const nextStatus = status ? String(status) : String(existing.status);
    const nextDate = appointmentDate ? String(appointmentDate) : String(existing.appointment_date);
    const nextTime = appointmentTime ? String(appointmentTime) : String(existing.appointment_time);

    if (nextStatus !== 'cancelled' && (appointmentDate || appointmentTime)) {
      const conflict = db
        .prepare(
          "SELECT id FROM appointments WHERE appointment_date = ? AND appointment_time = ? AND status != 'cancelled' AND id != ?"
        )
        .get(nextDate, nextTime, id);
      if (conflict) {
        return res.status(409).json({ error: 'Requested reschedule slot is already taken.' });
      }
    }

    db.prepare(
      'UPDATE appointments SET status = ?, appointment_date = ?, appointment_time = ? WHERE id = ?'
    ).run(nextStatus, nextDate, nextTime, id);

    await dispatchOwnerNotification({
      eventType: 'appointment_updated',
      subject: `[GROVIADS Booking Update] ${String(existing.name)} — ${nextStatus}`,
      bodyText: `Appointment ${id} for ${String(existing.name)} (${String(existing.email)}) updated to status "${nextStatus}" on ${nextDate} at ${nextTime}.`,
    });

    const updated = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    res.json({ appointment: updated });
  });

  // Leads & Enquiries
  app.get('/api/leads', (_req, res) => {
    const rows = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
    res.json({ leads: rows });
  });

  app.post('/api/leads', async (req, res) => {
    try {
      const body = req.body || {};
      const validation = validateLeadForm({
        name: String(body.name || ''),
        email: String(body.email || ''),
        country: String(body.country || ''),
        phone: String(body.phone || ''),
        serviceInterest: String(body.serviceInterest || ''),
        challenges: String(body.challenges || ''),
      });

      if (!validation.valid) {
        return res.status(400).json({ error: 'Validation failed', errors: validation.errors });
      }

      const id = `ld_${crypto.randomBytes(5).toString('hex')}`;
      const now = new Date().toISOString();
      const clientId = String(body.clientId || `cli_${crypto.randomBytes(4).toString('hex')}`);
      const cleanEmail = String(body.email).trim().toLowerCase();

      db.prepare(
        `INSERT INTO leads (id, client_id, name, email, country, phone, service_interest, challenges, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)`
      ).run(
        id,
        clientId,
        String(body.name).trim(),
        cleanEmail,
        String(body.country).trim(),
        String(body.phone).trim(),
        String(body.serviceInterest).trim(),
        String(body.challenges).trim(),
        now
      );

      db.prepare(
        `INSERT INTO visitor_profiles (client_id, name, email, country, phone, visit_count, has_booked_free_consult, last_seen_at, created_at)
         VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?)
         ON CONFLICT(client_id) DO UPDATE SET name=excluded.name, email=excluded.email, country=excluded.country, phone=excluded.phone, last_seen_at=excluded.last_seen_at`
      ).run(
        clientId,
        String(body.name).trim(),
        cleanEmail,
        String(body.country).trim(),
        String(body.phone).trim(),
        now,
        now
      );

      db.prepare(
        'INSERT INTO analytics_events (id, client_id, event_type, section, label, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(
        `ev_${crypto.randomBytes(5).toString('hex')}`,
        clientId,
        'lead_submitted',
        'contact',
        String(body.serviceInterest).trim(),
        JSON.stringify({ leadId: id, country: String(body.country).trim() }),
        now
      );

      const notification = await dispatchOwnerNotification({
        eventType: 'new_lead',
        clientEmail: cleanEmail,
        subject: `[GROVIADS New Lead] ${String(body.name).trim()} — ${String(body.serviceInterest).trim()}`,
        bodyText: [
          `New client inquiry submitted via GROVIADS:`,
          `Lead ID: ${id}`,
          `Name: ${String(body.name).trim()}`,
          `Email: ${cleanEmail}`,
          `Country: ${String(body.country).trim()}`,
          `Phone / WhatsApp: ${String(body.phone).trim()}`,
          `Service of Interest: ${String(body.serviceInterest).trim()}`,
          `Challenges & Goals: ${String(body.challenges).trim()}`,
          `SLA Reminder: Follow up within 24 hours.`,
        ].join('\n'),
      });

      const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
      return res.status(201).json({ lead, notification });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save project enquiry.';
      return res.status(500).json({ error: message });
    }
  });

  app.patch('/api/leads/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body || {};
    const allowed = new Set(['new', 'contacted', 'proposal_sent', 'won', 'archived']);
    if (!allowed.has(String(status))) {
      return res.status(400).json({ error: 'Invalid lead status.' });
    }
    const result = db.prepare('UPDATE leads SET status = ? WHERE id = ?').run(String(status), id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Lead not found.' });
    }
    const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
    res.json({ lead: updated });
  });

  // Payments
  app.get('/api/payments', (_req, res) => {
    const rows = db.prepare('SELECT * FROM payments ORDER BY created_at DESC').all();
    res.json({ payments: rows });
  });

  app.post('/api/payments/checkout', async (req, res) => {
    const body = req.body || {};
    const pkg = SERVICE_PACKAGES.find((p) => p.id === String(body.packageId));
    if (!pkg || pkg.serviceFeeUsd <= 0) {
      return res.status(400).json({ error: 'Select a valid paid GROVIADS service package.' });
    }

    const validation = validateCardPayment({
      cardholderName: String(body.cardholderName || ''),
      cardNumber: String(body.cardNumber || ''),
      expiry: String(body.expiry || ''),
      cvc: String(body.cvc || ''),
      email: String(body.email || ''),
    });

    if (!validation.valid) {
      return res.status(400).json({ error: 'Payment validation failed', errors: validation.errors });
    }

    const cleanCard = String(body.cardNumber).replace(/\D/g, '');
    const last4 = cleanCard.slice(-4);
    const brand = detectCardBrand(cleanCard);
    const adBudget = Number(body.thirdPartyAdBudgetUsd || 0);
    const breakdown = calculateFeeBreakdown(pkg.serviceFeeUsd, adBudget);

    const id = `pay_${crypto.randomBytes(5).toString('hex')}`;
    const transactionRef = `GRV-TXN-${crypto.randomInt(10000, 99999)}`;
    const now = new Date().toISOString();
    const clientId = String(body.clientId || `cli_${crypto.randomBytes(4).toString('hex')}`);
    const cleanEmail = String(body.email).trim().toLowerCase();

    db.prepare(
      `INSERT INTO payments (id, client_id, package_id, package_name, cadence, client_name, client_email, service_fee_usd, processing_fee_usd, total_charged_usd, third_party_ad_budget_usd, card_brand, card_last4, transaction_ref, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?)`
    ).run(
      id,
      clientId,
      pkg.id,
      pkg.name,
      pkg.cadence,
      String(body.cardholderName).trim(),
      cleanEmail,
      breakdown.serviceFeeUsd,
      breakdown.processingFeeUsd,
      breakdown.payableNowUsd,
      breakdown.thirdPartyAdBudgetUsd,
      brand,
      last4,
      transactionRef,
      now
    );

    db.prepare(
      'INSERT INTO analytics_events (id, client_id, event_type, section, label, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      `ev_${crypto.randomBytes(5).toString('hex')}`,
      clientId,
      'payment_completed',
      'payments',
      `${pkg.name} ($${breakdown.payableNowUsd})`,
      JSON.stringify({ paymentId: id, transactionRef }),
      now
    );

    const notification = await dispatchOwnerNotification({
      eventType: 'payment_received',
      clientEmail: cleanEmail,
      subject: `[GROVIADS Payment] $${breakdown.payableNowUsd.toFixed(2)} — ${pkg.name}`,
      bodyText: [
        `Secure payment processed on GROVIADS:`,
        `Transaction Ref: ${transactionRef}`,
        `Client: ${String(body.cardholderName).trim()} (${cleanEmail})`,
        `Package: ${pkg.name} (${pkg.cadence})`,
        `GROVIADS Service Fee: $${breakdown.serviceFeeUsd.toFixed(2)}`,
        `Processing Fee: $${breakdown.processingFeeUsd.toFixed(2)}`,
        `Total Charged: $${breakdown.payableNowUsd.toFixed(2)}`,
        `Separate Ad Spend Allowance Noted: $${breakdown.thirdPartyAdBudgetUsd.toFixed(2)} (billed directly to client ad accounts)`,
        `Payment Method: ${brand} ending in ${last4}`,
      ].join('\n'),
    });

    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
    res.status(201).json({ payment, notification });
  });

  // E2EE Messaging
  app.get('/api/e2ee/messages', (req, res) => {
    const threadId = String(req.query.threadId || '').trim();
    const rows = threadId
      ? db
          .prepare('SELECT * FROM encrypted_messages WHERE thread_id = ? ORDER BY created_at ASC')
          .all(threadId)
      : db.prepare('SELECT * FROM encrypted_messages ORDER BY created_at ASC').all();
    res.json({ messages: rows });
  });

  app.post('/api/e2ee/messages', async (req, res) => {
    const body = req.body || {};
    if (!body.threadId || !body.ciphertext || !body.iv || !body.senderPublicKey || !body.recipientPublicKey) {
      return res.status(400).json({ error: 'Encrypted payload fields are required.' });
    }
    const id = `msg_${crypto.randomBytes(5).toString('hex')}`;
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO encrypted_messages (id, thread_id, client_id, client_name, client_email, sender_role, ciphertext, iv, sender_public_key, recipient_public_key, fingerprint, algorithm, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      String(body.threadId),
      String(body.clientId || body.threadId),
      String(body.clientName || 'Client Visitor'),
      body.clientEmail ? String(body.clientEmail).trim().toLowerCase() : null,
      String(body.senderRole || 'client'),
      String(body.ciphertext),
      String(body.iv),
      JSON.stringify(body.senderPublicKey),
      JSON.stringify(body.recipientPublicKey),
      String(body.fingerprint || ''),
      String(body.algorithm || 'ECDH-P256-AES-GCM-256'),
      now
    );

    if (body.senderRole !== 'advisor') {
      db.prepare(
        'INSERT INTO analytics_events (id, client_id, event_type, section, label, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(
        `ev_${crypto.randomBytes(5).toString('hex')}`,
        String(body.clientId || body.threadId),
        'e2ee_message_sent',
        'live_chat',
        'Encrypted Client Message',
        JSON.stringify({ threadId: String(body.threadId) }),
        now
      );

      await dispatchOwnerNotification({
        eventType: 'e2ee_message',
        clientEmail: body.clientEmail ? String(body.clientEmail).trim().toLowerCase() : undefined,
        subject: `[GROVIADS E2EE Chat] New encrypted message from ${body.clientName || 'Website Visitor'}`,
        bodyText: [
          `A new end-to-end encrypted message was sent via GROVIADS Live Chat.`,
          `Sender: ${body.clientName || 'Website Visitor'} ${body.clientEmail ? `(${body.clientEmail})` : ''}`,
          `Thread ID: ${body.threadId}`,
          `Key Fingerprint: ${body.fingerprint}`,
          `Security Notice: Server stores ciphertext only. Open your GROVIADS Executive Dashboard to decrypt locally.`,
        ].join('\n'),
      });
    }

    const saved = db.prepare('SELECT * FROM encrypted_messages WHERE id = ?').get(id);
    res.status(201).json({ message: saved });
  });

  // Analytics tracking
  app.post('/api/analytics/track', (req, res) => {
    const body = req.body || {};
    if (!body.eventType || !body.section) {
      return res.status(400).json({ error: 'eventType and section are required.' });
    }
    const id = `ev_${crypto.randomBytes(5).toString('hex')}`;
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO analytics_events (id, client_id, event_type, section, label, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      body.clientId ? String(body.clientId) : null,
      String(body.eventType),
      String(body.section),
      String(body.label || body.eventType),
      JSON.stringify(body.metadata || {}),
      now
    );
    res.status(201).json({ ok: true, id });
  });

  // Executive Dashboard Summary
  app.get('/api/dashboard/summary', (_req, res) => {
    const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
    const appointments = db
      .prepare('SELECT * FROM appointments ORDER BY appointment_date ASC, appointment_time ASC')
      .all();
    const payments = db.prepare('SELECT * FROM payments ORDER BY created_at DESC').all();
    const notifications = db
      .prepare('SELECT * FROM email_notifications ORDER BY created_at DESC LIMIT 50')
      .all();
    const analytics = db
      .prepare(
        "SELECT * FROM analytics_events WHERE event_type != 'payment_completed' ORDER BY created_at DESC LIMIT 100"
      )
      .all();
    const visitors = db
      .prepare('SELECT * FROM visitor_profiles ORDER BY last_seen_at DESC LIMIT 50')
      .all();
    const encryptedMessages = db
      .prepare('SELECT * FROM encrypted_messages ORDER BY created_at ASC')
      .all();
    const advisorRow = db
      .prepare('SELECT public_key_jwk, private_key_jwk, fingerprint FROM advisor_keys WHERE id = ?')
      .get('groviads-desk-primary') as
      | { public_key_jwk: string; private_key_jwk: string; fingerprint: string }
      | undefined;

    const totalRevenueRow = db
      .prepare("SELECT COALESCE(SUM(total_charged_usd), 0) as total FROM payments WHERE status = 'paid'")
      .get() as { total: number };

    const eventCounts = db
      .prepare(
        "SELECT event_type, COUNT(*) as count FROM analytics_events WHERE event_type != 'payment_completed' GROUP BY event_type"
      )
      .all() as { event_type: string; count: number }[];

    const cfg = getNotificationConfig();

    res.json({
      kpis: {
        totalLeads: leads.length,
        scheduledConsultations: (appointments as { status: string }[]).filter(
          (a) => a.status === 'scheduled'
        ).length,
        totalConsultations: appointments.length,
        settledRevenueUsd: Number(totalRevenueRow.total || 0),
        trackedEvents: analytics.length,
        notificationsSent: notifications.length,
      },
      eventCounts,
      leads,
      appointments,
      payments,
      notifications,
      analytics,
      visitors,
      encryptedMessages,
      advisorKeyring: advisorRow
        ? {
            publicKeyJwk: JSON.parse(advisorRow.public_key_jwk),
            privateKeyJwk: JSON.parse(advisorRow.private_key_jwk),
            fingerprint: advisorRow.fingerprint,
          }
        : null,
      notificationConfig: {
        ownerEmail: cfg.ownerEmail,
        companyEmail: cfg.companyEmail,
        smtpConfigured: cfg.smtpConfigured,
      },
    });
  });

  app.post('/api/notifications/test', async (_req, res) => {
    const cfg = getNotificationConfig();
    const result = await dispatchOwnerNotification({
      eventType: 'system_test',
      subject: '[GROVIADS Verification] Email Notification Pipeline Active',
      bodyText: `This verification confirms that new leads, consultation bookings, returning-user alerts, and E2EE message notifications are routed to ${cfg.ownerEmail} (CC: ${cfg.companyEmail}).`,
    });
    res.json({ notification: result });
  });

  // Server-Side Gemini AI Advisory Endpoints
  app.post('/api/ai/chat', async (req, res) => {
    const body = req.body || {};
    const message = String(body.message || '').trim();
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }
    const allowedModels = new Set<FreeChatModel>(['gemini-4-hydrogen', 'gemini-3.1-flash-lite']);
    const model: FreeChatModel = allowedModels.has(body.model)
      ? body.model
      : 'gemini-4-hydrogen';
    const allowedRoles = new Set<ChatRolePreset>([
      'strategist',
      'architect',
      'analyst',
      'concierge',
    ]);
    const rolePreset: ChatRolePreset = allowedRoles.has(body.rolePreset)
      ? body.rolePreset
      : 'strategist';
    const history = Array.isArray(body.history)
      ? body.history
          .filter(
            (h: unknown): h is { role: 'user' | 'model'; text: string } =>
              Boolean(h) &&
              typeof h === 'object' &&
              ((h as { role?: string }).role === 'user' ||
                (h as { role?: string }).role === 'model') &&
              typeof (h as { text?: unknown }).text === 'string'
          )
          .slice(-24)
      : [];

    try {
      const result = await runMultiTurnChat({
        history,
        message,
        rolePreset,
        model,
        thinkingDepth: body.thinkingDepth === 'high' ? 'high' : 'low',
      });
      res.json(result);
    } catch (error) {
      const normalized = normalizeGeminiError(error);
      res.status(normalized.status).json({ error: normalized.message });
    }
  });

  app.post('/api/ai/search-grounding', async (req, res) => {
    const prompt = String(req.body?.prompt || '').trim();
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }
    try {
      const result = await runSearchGroundedQuery(prompt);
      res.json(result);
    } catch (error) {
      const normalized = normalizeGeminiError(error);
      res.status(normalized.status).json({ error: normalized.message });
    }
  });

  app.post('/api/ai/maps-grounding', async (req, res) => {
    const prompt = String(req.body?.prompt || '').trim();
    if (!prompt) {
      return res.status(400).json({ error: 'Location query is required.' });
    }
    const lat = req.body?.latitude !== undefined ? Number(req.body.latitude) : undefined;
    const lng = req.body?.longitude !== undefined ? Number(req.body.longitude) : undefined;
    try {
      const result = await runMapsGroundedQuery({
        prompt,
        latitude: Number.isFinite(lat) ? lat : undefined,
        longitude: Number.isFinite(lng) ? lng : undefined,
      });
      res.json(result);
    } catch (error) {
      const normalized = normalizeGeminiError(error);
      res.status(normalized.status).json({ error: normalized.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GROVIADS platform running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start GROVIADS server:', err);
  process.exit(1);
});
