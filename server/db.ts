import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import {
  computeKeyFingerprint,
  encryptMessageE2EE,
  generateEcdhKeyPair,
} from '../src/utils/crypto';
import { getNextBusinessDates } from '../src/utils/validation';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'groviads.db');
export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS advisor_keys (
      id TEXT PRIMARY KEY,
      public_key_jwk TEXT NOT NULL,
      private_key_jwk TEXT NOT NULL,
      fingerprint TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS visitor_profiles (
      client_id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      country TEXT,
      phone TEXT,
      visit_count INTEGER NOT NULL DEFAULT 1,
      has_booked_free_consult INTEGER NOT NULL DEFAULT 0,
      last_seen_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      country TEXT NOT NULL,
      phone TEXT NOT NULL,
      service_interest TEXT NOT NULL,
      challenges TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      country TEXT NOT NULL,
      service_interest TEXT NOT NULL,
      package_id TEXT NOT NULL DEFAULT 'free-consultation',
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      timezone TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      package_id TEXT NOT NULL,
      package_name TEXT NOT NULL,
      cadence TEXT NOT NULL,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      service_fee_usd REAL NOT NULL,
      processing_fee_usd REAL NOT NULL,
      total_charged_usd REAL NOT NULL,
      third_party_ad_budget_usd REAL NOT NULL DEFAULT 0,
      card_brand TEXT NOT NULL,
      card_last4 TEXT NOT NULL,
      transaction_ref TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'paid',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS encrypted_messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      client_name TEXT NOT NULL,
      client_email TEXT,
      sender_role TEXT NOT NULL,
      ciphertext TEXT NOT NULL,
      iv TEXT NOT NULL,
      sender_public_key TEXT NOT NULL,
      recipient_public_key TEXT NOT NULL,
      fingerprint TEXT NOT NULL,
      algorithm TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      event_type TEXT NOT NULL,
      section TEXT NOT NULL,
      label TEXT NOT NULL,
      metadata_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_notifications (
      id TEXT PRIMARY KEY,
      recipient TEXT NOT NULL,
      cc_recipient TEXT,
      event_type TEXT NOT NULL,
      subject TEXT NOT NULL,
      body_text TEXT NOT NULL,
      delivery_mode TEXT NOT NULL,
      delivery_status TEXT NOT NULL,
      error_message TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

export async function ensureAdvisorKeyAndSeedData() {
  initSchema();

  const existingKey = db
    .prepare('SELECT * FROM advisor_keys WHERE id = ?')
    .get('groviads-desk-primary') as
    | {
        id: string;
        public_key_jwk: string;
        private_key_jwk: string;
        fingerprint: string;
      }
    | undefined;

  let advisorPubJwk: JsonWebKey;
  let advisorPrivJwk: JsonWebKey;
  let advisorFp: string;

  if (!existingKey) {
    const pair = await generateEcdhKeyPair();
    advisorPubJwk = pair.publicKeyJwk;
    advisorPrivJwk = pair.privateKeyJwk;
    advisorFp = await computeKeyFingerprint(advisorPubJwk);
    db.prepare(
      'INSERT INTO advisor_keys (id, public_key_jwk, private_key_jwk, fingerprint, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(
      'groviads-desk-primary',
      JSON.stringify(advisorPubJwk),
      JSON.stringify(advisorPrivJwk),
      advisorFp,
      new Date().toISOString()
    );
  } else {
    advisorPubJwk = JSON.parse(existingKey.public_key_jwk);
    advisorPrivJwk = JSON.parse(existingKey.private_key_jwk);
    advisorFp = existingKey.fingerprint;
  }

  const leadCount = (db.prepare('SELECT COUNT(*) as c FROM leads').get() as { c: number }).c;
  if (leadCount === 0) {
    const now = new Date();
    const dates = getNextBusinessDates(5, now);
    const isoMinusHours = (h: number) =>
      new Date(now.getTime() - h * 3600 * 1000).toISOString();

    // Seed 2 realistic leads
    db.prepare(
      `INSERT INTO leads (id, client_id, name, email, country, phone, service_interest, challenges, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'ld_seed_01',
      'cli_seed_meridian',
      'Nadia Al-Mansoor',
      'nadia@meridianhealth.ae',
      'United Arab Emirates',
      '+971 50 482 1904',
      'Digital Marketing & Search Optimization',
      'Expanding clinic visibility across Dubai with Local SEO, AEO/GEO and automated patient booking.',
      'contacted',
      isoMinusHours(18)
    );

    db.prepare(
      `INSERT INTO leads (id, client_id, name, email, country, phone, service_interest, challenges, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'ld_seed_02',
      'cli_seed_kestrel',
      'Henrik Lindqvist',
      'henrik@kestrellogistics.de',
      'Germany',
      '+49 30 901820',
      'Software Development & Engineering',
      'Need a custom B2B freight client portal with REST API carrier tracking and automated email alerts.',
      'proposal_sent',
      isoMinusHours(6)
    );

    // Seed 2 upcoming appointments
    db.prepare(
      `INSERT INTO appointments (id, client_id, name, email, phone, country, service_interest, package_id, appointment_date, appointment_time, timezone, notes, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'bk_seed_01',
      'cli_seed_meridian',
      'Nadia Al-Mansoor',
      'nadia@meridianhealth.ae',
      '+971 50 482 1904',
      'United Arab Emirates',
      'Digital Marketing & Search Optimization',
      'free-consultation',
      dates[0],
      '10:00',
      'Asia/Dubai (GST)',
      'Initial 30-minute discovery review for multi-location Local SEO & GEO.',
      'scheduled',
      isoMinusHours(16)
    );

    db.prepare(
      `INSERT INTO appointments (id, client_id, name, email, phone, country, service_interest, package_id, appointment_date, appointment_time, timezone, notes, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'bk_seed_02',
      'cli_seed_kestrel',
      'Henrik Lindqvist',
      'henrik@kestrellogistics.de',
      '+49 30 901820',
      'Germany',
      'Software Development & Engineering',
      'free-consultation',
      dates[1],
      '14:00',
      'Europe/Berlin (CET)',
      'Review architecture scope for custom B2B portal & ERP API sync.',
      'scheduled',
      isoMinusHours(5)
    );

    // Seed 1 completed payment
    db.prepare(
      `INSERT INTO payments (id, client_id, package_id, package_name, cadence, client_name, client_email, service_fee_usd, processing_fee_usd, total_charged_usd, third_party_ad_budget_usd, card_brand, card_last4, transaction_ref, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'pay_seed_01',
      'cli_seed_meridian',
      'growth-audit-sprint',
      'Growth Strategy & Technical Audit',
      'One-Time',
      'Nadia Al-Mansoor',
      'nadia@meridianhealth.ae',
      490,
      14.51,
      504.51,
      1500,
      'Visa',
      '4242',
      'GRV-TXN-88412',
      'paid',
      isoMinusHours(12)
    );

    // Seed visitor profiles
    db.prepare(
      `INSERT INTO visitor_profiles (client_id, name, email, country, phone, visit_count, has_booked_free_consult, last_seen_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'cli_seed_meridian',
      'Nadia Al-Mansoor',
      'nadia@meridianhealth.ae',
      'United Arab Emirates',
      '+971 50 482 1904',
      3,
      1,
      isoMinusHours(12),
      isoMinusHours(24)
    );

    // Seed real E2EE encrypted message thread
    const demoClientKeys = await generateEcdhKeyPair();
    const env1 = await encryptMessageE2EE({
      plaintext:
        'Hello GROVIADS team — sharing our confidential Q1 clinic expansion goals ahead of Thursday’s free discovery call.',
      senderPrivateKeyJwk: demoClientKeys.privateKeyJwk,
      senderPublicKeyJwk: demoClientKeys.publicKeyJwk,
      recipientPublicKeyJwk: advisorPubJwk,
    });
    const env2 = await encryptMessageE2EE({
      plaintext:
        'Received securely via E2EE. We have prepared your Local SEO & booking automation baseline for our call.',
      senderPrivateKeyJwk: advisorPrivJwk,
      senderPublicKeyJwk: advisorPubJwk,
      recipientPublicKeyJwk: demoClientKeys.publicKeyJwk,
    });

    db.prepare(
      `INSERT INTO encrypted_messages (id, thread_id, client_id, client_name, client_email, sender_role, ciphertext, iv, sender_public_key, recipient_public_key, fingerprint, algorithm, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'msg_seed_01',
      'cli_seed_meridian',
      'cli_seed_meridian',
      'Nadia Al-Mansoor',
      'nadia@meridianhealth.ae',
      'client',
      env1.ciphertext,
      env1.iv,
      JSON.stringify(env1.senderPublicKey),
      JSON.stringify(env1.recipientPublicKey),
      env1.fingerprint,
      env1.algorithm,
      isoMinusHours(14)
    );

    db.prepare(
      `INSERT INTO encrypted_messages (id, thread_id, client_id, client_name, client_email, sender_role, ciphertext, iv, sender_public_key, recipient_public_key, fingerprint, algorithm, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'msg_seed_02',
      'cli_seed_meridian',
      'cli_seed_meridian',
      'Nadia Al-Mansoor',
      'nadia@meridianhealth.ae',
      'advisor',
      env2.ciphertext,
      env2.iv,
      JSON.stringify(env2.senderPublicKey),
      JSON.stringify(env2.recipientPublicKey),
      advisorFp,
      env2.algorithm,
      isoMinusHours(13)
    );

    // Seed analytics events
    const seedEvents = [
      ['ev_seed_01', 'cli_seed_meridian', 'page_view', 'hero', 'Landing Page Visit', isoMinusHours(24)],
      ['ev_seed_02', 'cli_seed_meridian', 'portfolio_filter', 'portfolio', 'Growth Services Filter', isoMinusHours(23)],
      ['ev_seed_03', 'cli_seed_meridian', 'booking_completed', 'scheduler', 'Free Consultation Booked', isoMinusHours(16)],
      ['ev_seed_04', 'cli_seed_kestrel', 'lead_submitted', 'contact', 'Software Engineering Enquiry', isoMinusHours(6)],
      ['ev_seed_05', 'cli_seed_meridian', 'e2ee_message_sent', 'live_chat', 'Encrypted Client Message', isoMinusHours(12)],
    ];
    const insertEv = db.prepare(
      'INSERT INTO analytics_events (id, client_id, event_type, section, label, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    for (const ev of seedEvents) {
      insertEv.run(ev[0], ev[1], ev[2], ev[3], ev[4], '{}', ev[5]);
    }

    // Seed initial notification records to deepaksharmattri1@gmail.com
    db.prepare(
      `INSERT INTO email_notifications (id, recipient, cc_recipient, event_type, subject, body_text, delivery_mode, delivery_status, error_message, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'ntf_seed_01',
      'deepaksharmattri1@gmail.com',
      'contact@groviads.com',
      'appointment_booked',
      '[GROVIADS Booking] Free Consultation — Nadia Al-Mansoor',
      `New Free Consultation booked by Nadia Al-Mansoor (nadia@meridianhealth.ae) for ${dates[0]} at 10:00 (Asia/Dubai).`,
      'outbox_log',
      'queued_outbox',
      null,
      isoMinusHours(16)
    );
  }
}
