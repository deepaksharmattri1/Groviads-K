export interface LeadRecord {
  id: string;
  client_id: string | null;
  name: string;
  email: string;
  country: string;
  phone: string;
  service_interest: string;
  challenges: string;
  status: 'new' | 'contacted' | 'proposal_sent' | 'won' | 'archived';
  created_at: string;
}

export interface AppointmentRecord {
  id: string;
  client_id: string | null;
  name: string;
  email: string;
  phone: string;
  country: string;
  service_interest: string;
  package_id: string;
  appointment_date: string;
  appointment_time: string;
  timezone: string;
  notes: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  client_id: string | null;
  package_id: string;
  package_name: string;
  cadence: string;
  client_name: string;
  client_email: string;
  service_fee_usd: number;
  processing_fee_usd: number;
  total_charged_usd: number;
  third_party_ad_budget_usd: number;
  card_brand: string;
  card_last4: string;
  transaction_ref: string;
  status: string;
  created_at: string;
}

export interface EncryptedMessageRecord {
  id: string;
  thread_id: string;
  client_id: string;
  client_name: string;
  client_email: string | null;
  sender_role: 'client' | 'advisor';
  ciphertext: string;
  iv: string;
  sender_public_key: string;
  recipient_public_key: string;
  fingerprint: string;
  algorithm: string;
  created_at: string;
}

export interface EmailNotificationRecord {
  id: string;
  recipient: string;
  cc_recipient: string | null;
  event_type: string;
  subject: string;
  body_text: string;
  delivery_mode: string;
  delivery_status: string;
  error_message: string | null;
  created_at: string;
}

export interface AnalyticsEventRecord {
  id: string;
  client_id: string | null;
  event_type: string;
  section: string;
  label: string;
  metadata_json: string | null;
  created_at: string;
}

export interface VisitorProfile {
  client_id: string;
  name: string | null;
  email: string | null;
  country: string | null;
  phone: string | null;
  visit_count: number;
  has_booked_free_consult: number;
  last_seen_at: string;
}

export interface DashboardSummary {
  kpis: {
    totalLeads: number;
    scheduledConsultations: number;
    totalConsultations: number;
    settledRevenueUsd: number;
    trackedEvents: number;
    notificationsSent: number;
  };
  eventCounts: { event_type: string; count: number }[];
  leads: LeadRecord[];
  appointments: AppointmentRecord[];
  payments: PaymentRecord[];
  notifications: EmailNotificationRecord[];
  analytics: AnalyticsEventRecord[];
  visitors: VisitorProfile[];
  encryptedMessages: EncryptedMessageRecord[];
  advisorKeyring: {
    publicKeyJwk: JsonWebKey;
    privateKeyJwk: JsonWebKey;
    fingerprint: string;
  } | null;
  notificationConfig: {
    ownerEmail: string;
    companyEmail: string;
    smtpConfigured: boolean;
  };
}
