import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { db } from './db';

export interface NotificationPayload {
  eventType:
    | 'new_lead'
    | 'appointment_booked'
    | 'appointment_updated'
    | 'payment_received'
    | 'e2ee_message'
    | 'returning_user_alert'
    | 'system_test';
  subject: string;
  bodyText: string;
  clientEmail?: string;
}

export function getNotificationConfig() {
  const ownerEmail = process.env.NOTIFICATION_EMAIL?.trim() || 'deepaksharmattri1@gmail.com';
  const companyEmail = process.env.COMPANY_EMAIL?.trim() || 'contact@groviads.com';
  const smtpHost = process.env.SMTP_HOST?.trim() || '';
  const smtpPort = Number(process.env.SMTP_PORT || '587');
  const smtpUser = process.env.SMTP_USER?.trim() || '';
  const smtpPass = process.env.SMTP_PASS?.trim() || '';
  const smtpFrom =
    process.env.SMTP_FROM?.trim() || `GROVIADS Notifications <${companyEmail}>`;
  const smtpConfigured = Boolean(smtpHost && smtpUser && smtpPass);

  return {
    ownerEmail,
    companyEmail,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    smtpFrom,
    smtpConfigured,
  };
}

export async function dispatchOwnerNotification(payload: NotificationPayload) {
  const cfg = getNotificationConfig();
  const id = `ntf_${crypto.randomBytes(6).toString('hex')}`;
  const createdAt = new Date().toISOString();

  let deliveryMode: 'smtp' | 'outbox_log' = 'outbox_log';
  let deliveryStatus: 'sent' | 'queued_outbox' | 'failed' = 'queued_outbox';
  let errorMessage: string | null = null;

  if (cfg.smtpConfigured) {
    deliveryMode = 'smtp';
    try {
      const transporter = nodemailer.createTransport({
        host: cfg.smtpHost,
        port: cfg.smtpPort,
        secure: cfg.smtpPort === 465,
        auth: {
          user: cfg.smtpUser,
          pass: cfg.smtpPass,
        },
      });

      const recipients = [cfg.ownerEmail];
      if (cfg.companyEmail && cfg.companyEmail !== cfg.ownerEmail) {
        recipients.push(cfg.companyEmail);
      }

      await transporter.sendMail({
        from: cfg.smtpFrom,
        to: recipients.join(', '),
        replyTo: payload.clientEmail || cfg.companyEmail,
        subject: payload.subject,
        text: payload.bodyText,
      });

      if (payload.clientEmail) {
        await transporter.sendMail({
          from: cfg.smtpFrom,
          to: payload.clientEmail,
          replyTo: cfg.companyEmail,
          subject: `GROVIADS Confirmation: ${payload.subject.replace(/^\[GROVIADS[^\]]*\]\s*/, '')}`,
          text: `${payload.bodyText}\n\n---\nGROVIADS — Business Growth & Technology Solutions\nWebsite: https://groviads.com | Email: ${cfg.companyEmail}\nWe aim to follow up within 24 hours.`,
        });
      }

      deliveryStatus = 'sent';
    } catch (err) {
      deliveryStatus = 'failed';
      errorMessage = err instanceof Error ? err.message : 'SMTP delivery error';
    }
  }

  db.prepare(
    `INSERT INTO email_notifications (id, recipient, cc_recipient, event_type, subject, body_text, delivery_mode, delivery_status, error_message, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    cfg.ownerEmail,
    cfg.companyEmail,
    payload.eventType,
    payload.subject,
    payload.bodyText,
    deliveryMode,
    deliveryStatus,
    errorMessage,
    createdAt
  );

  return {
    id,
    recipient: cfg.ownerEmail,
    ccRecipient: cfg.companyEmail,
    deliveryMode,
    deliveryStatus,
    errorMessage,
    createdAt,
  };
}
