import {
  Activity,
  ArrowLeft,
  Calendar,
  Lock,
  Mail,
  RefreshCw,
  Send,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { DashboardSummary, EncryptedMessageRecord } from '../types';
import { decryptMessageE2EE, encryptMessageE2EE } from '../utils/crypto';

type DashboardTab =
  | 'overview'
  | 'leads'
  | 'appointments'
  | 'messages'
  | 'notifications';

interface DecryptedThreadMessage {
  id: string;
  threadId: string;
  clientName: string;
  clientEmail: string | null;
  senderRole: 'client' | 'advisor';
  plaintext: string;
  ciphertextPreview: string;
  fingerprint: string;
  createdAt: string;
  clientPublicKey: JsonWebKey;
}

interface ExecutiveDashboardProps {
  clientId: string;
  onReturnToWebsite: () => void;
  onBookFreeCall: () => void;
}

export function ExecutiveDashboard({
  clientId,
  onReturnToWebsite,
  onBookFreeCall,
}: ExecutiveDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [viewScope, setViewScope] = useState<'agency' | 'client'>('agency');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // E2EE Inbox state
  const [decryptedMessages, setDecryptedMessages] = useState<DecryptedThreadMessage[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string>('');
  const [replyDraft, setReplyDraft] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Notification test feedback
  const [testNotice, setTestNotice] = useState<string | null>(null);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard/summary');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to load dashboard data.');
        return;
      }
      setSummary(data);
    } catch {
      setError('Network error loading activity dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  // Decrypt all E2EE threads locally in the browser
  useEffect(() => {
    let active = true;
    async function decryptAll() {
      if (!summary?.advisorKeyring || !summary.encryptedMessages) return;
      const { privateKeyJwk, publicKeyJwk } = summary.advisorKeyring;
      const results: DecryptedThreadMessage[] = [];

      for (const row of summary.encryptedMessages as EncryptedMessageRecord[]) {
        try {
          const senderPub = JSON.parse(row.sender_public_key) as JsonWebKey;
          const recipientPub = JSON.parse(row.recipient_public_key) as JsonWebKey;
          const peerPub = row.sender_role === 'client' ? senderPub : recipientPub;
          const plaintext = await decryptMessageE2EE({
            ciphertext: row.ciphertext,
            iv: row.iv,
            ownPrivateKeyJwk: privateKeyJwk,
            peerPublicKeyJwk: peerPub,
          });
          results.push({
            id: row.id,
            threadId: row.thread_id,
            clientName: row.client_name,
            clientEmail: row.client_email,
            senderRole: row.sender_role,
            plaintext,
            ciphertextPreview: row.ciphertext.slice(0, 28) + '...',
            fingerprint: row.fingerprint,
            createdAt: row.created_at,
            clientPublicKey: peerPub,
          });
        } catch {
          results.push({
            id: row.id,
            threadId: row.thread_id,
            clientName: row.client_name,
            clientEmail: row.client_email,
            senderRole: row.sender_role,
            plaintext: '[Decryption key mismatch]',
            ciphertextPreview: row.ciphertext.slice(0, 28) + '...',
            fingerprint: row.fingerprint,
            createdAt: row.created_at,
            clientPublicKey: publicKeyJwk,
          });
        }
      }

      if (active) {
        setDecryptedMessages(results);
        if (!selectedThreadId && results.length > 0) {
          const sortedNewest = [...results].sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt)
          );
          setSelectedThreadId(sortedNewest[0].threadId);
        }
      }
    }
    decryptAll();
    return () => {
      active = false;
    };
  }, [summary]);

  const handleUpdateLeadStatus = async (leadId: string, nextStatus: string) => {
    const res = await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      await loadSummary();
    }
  };

  const handleUpdateAppointmentStatus = async (bookingId: string, nextStatus: string) => {
    const res = await fetch(`/api/appointments/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      await loadSummary();
    }
  };

  const handleSendEncryptedReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!replyDraft.trim() || !selectedThreadId || !summary?.advisorKeyring) return;
    const threadMsgs = decryptedMessages.filter((m) => m.threadId === selectedThreadId);
    const peerMsg = threadMsgs.find((m) => m.senderRole === 'client') || threadMsgs[0];
    if (!peerMsg) return;

    setSendingReply(true);
    try {
      const envelope = await encryptMessageE2EE({
        plaintext: replyDraft.trim(),
        senderPrivateKeyJwk: summary.advisorKeyring.privateKeyJwk,
        senderPublicKeyJwk: summary.advisorKeyring.publicKeyJwk,
        recipientPublicKeyJwk: peerMsg.clientPublicKey,
      });

      const res = await fetch('/api/e2ee/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: selectedThreadId,
          clientId: selectedThreadId,
          clientName: peerMsg.clientName,
          clientEmail: peerMsg.clientEmail,
          senderRole: 'advisor',
          ...envelope,
        }),
      });
      if (res.ok) {
        setReplyDraft('');
        await loadSummary();
      }
    } finally {
      setSendingReply(false);
    }
  };

  const handleSendTestNotification = async () => {
    setTestNotice('Sending verification email...');
    try {
      const res = await fetch('/api/notifications/test', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setTestNotice(
          `Notification logged for ${data.notification.recipient} (${data.notification.deliveryStatus}).`
        );
        await loadSummary();
      } else {
        setTestNotice('Failed to send verification notification.');
      }
    } catch {
      setTestNotice('Network error triggering notification.');
    }
  };

  const threads = useMemo(() => {
    const map = new Map<
      string,
      {
        threadId: string;
        clientName: string;
        clientEmail: string | null;
        count: number;
        latestAt: string;
      }
    >();
    for (const msg of decryptedMessages) {
      if (viewScope === 'client' && msg.threadId !== clientId) continue;
      const existing = map.get(msg.threadId);
      if (existing) {
        existing.count += 1;
        if (msg.createdAt > existing.latestAt) {
          existing.latestAt = msg.createdAt;
        }
      } else {
        map.set(msg.threadId, {
          threadId: msg.threadId,
          clientName: msg.clientName,
          clientEmail: msg.clientEmail,
          count: 1,
          latestAt: msg.createdAt,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      b.latestAt.localeCompare(a.latestAt)
    );
  }, [decryptedMessages, viewScope, clientId]);

  const filteredLeads = useMemo(() => {
    if (!summary) return [];
    const base =
      viewScope === 'client'
        ? summary.leads.filter((l) => l.client_id === clientId)
        : summary.leads;
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.service_interest.toLowerCase().includes(q)
    );
  }, [summary, viewScope, clientId, searchQuery]);

  const filteredAppointments = useMemo(() => {
    if (!summary) return [];
    const base =
      viewScope === 'client'
        ? summary.appointments.filter((a) => a.client_id === clientId)
        : summary.appointments;
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.service_interest.toLowerCase().includes(q)
    );
  }, [summary, viewScope, clientId, searchQuery]);

  const navItems: { id: DashboardTab; label: string; icon: typeof Activity }[] = [
    { id: 'overview', label: 'Overview & Analytics', icon: Activity },
    { id: 'leads', label: 'Leads & Enquiries', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'messages', label: 'E2EE Secure Inbox', icon: Lock },
    { id: 'notifications', label: 'Email Notifications', icon: Mail },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] flex flex-col lg:flex-row">
      {/* Sidebar Navigation (256px on desktop) */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-4 lg:p-5 shrink-0">
        <div className="mb-5 pb-4 border-b border-slate-200 flex items-center justify-between lg:block">
          <div>
            <p className="text-xs font-medium text-slate-500">Activity Workspace</p>
            <h1 className="font-display text-base font-bold text-[#0B1215]">
              GROVIADS Console
            </h1>
          </div>
          <button
            type="button"
            onClick={onReturnToWebsite}
            className="lg:hidden inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B1215]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Home
          </button>
        </div>

        <nav aria-label="Dashboard sections" className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#0B1215] text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-[#0B1215]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="hidden lg:block mt-8 pt-5 border-t border-slate-200">
          <button
            type="button"
            onClick={onReturnToWebsite}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#0B1215] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Public Website
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 p-4 sm:p-8 max-w-[1200px]">
        {/* Top Breadcrumb & Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200">
          <div>
            <p className="text-xs text-slate-500">
              GROVIADS / {viewScope === 'agency' ? 'Executive Tracking' : 'My Client Portal'} /{' '}
              {navItems.find((n) => n.id === activeTab)?.label}
            </p>
            <h2 className="font-display text-2xl font-bold text-[#0B1215] mt-1">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex p-1 bg-slate-200/70 rounded-lg">
              <button
                type="button"
                onClick={() => setViewScope('agency')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  viewScope === 'agency'
                    ? 'bg-white text-[#0B1215] shadow-xs'
                    : 'text-slate-600 hover:text-[#0B1215]'
                }`}
              >
                Agency View
              </button>
              <button
                type="button"
                onClick={() => setViewScope('client')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  viewScope === 'client'
                    ? 'bg-white text-[#0B1215] shadow-xs'
                    : 'text-slate-600 hover:text-[#0B1215]'
                }`}
              >
                My Client Activity
              </button>
            </div>

            <button
              type="button"
              onClick={loadSummary}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {loading && !summary ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-sm text-slate-500">
            Loading database records and analytics...
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-xl border border-red-200 p-6 text-sm text-red-800">
            {error}
          </div>
        ) : summary ? (
          <>
            {/* Overview & Analytics Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* 4 KPI Summary Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <p className="text-xs text-slate-500 mb-1">Active Leads &amp; Inquiries</p>
                    <p className="font-display text-3xl font-bold text-[#0B1215] tabular-nums">
                      {summary.kpis.totalLeads}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">Stored in relational SQLite DB</p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <p className="text-xs text-slate-500 mb-1">Scheduled Consultations</p>
                    <p className="font-display text-3xl font-bold text-[#0B1215] tabular-nums">
                      {summary.kpis.scheduledConsultations}
                    </p>
                    <p className="text-xs text-slate-500 mt-2 tabular-nums">
                      {summary.kpis.totalConsultations} total bookings recorded
                    </p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <p className="text-xs text-slate-500 mb-1">Tracked Activity Events</p>
                    <p className="font-display text-3xl font-bold text-[#0B1215] tabular-nums">
                      {summary.kpis.trackedEvents}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      Interactions logged across funnel
                    </p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <p className="text-xs text-slate-500 mb-1">Owner Email Alerts Logged</p>
                    <p className="font-display text-3xl font-bold text-[#1D4ED8] tabular-nums">
                      {summary.kpis.notificationsSent}
                    </p>
                    <p className="text-xs text-slate-500 mt-2 truncate">
                      To {summary.notificationConfig.ownerEmail}
                    </p>
                  </div>
                </div>

                {/* Client Portal Invitation Prompt when in Client View without booking */}
                {viewScope === 'client' && filteredAppointments.length === 0 && (
                  <div className="bg-[#0B1215] text-white rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display text-base font-bold">
                        You have not scheduled your free 30-minute consultation yet
                      </h3>
                      <p className="text-xs text-slate-300 mt-1">
                        Reserve an open slot to review your growth, website, or software goals.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onBookFreeCall}
                      className="px-4 py-2.5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Book Free Appointment
                    </button>
                  </div>
                )}

                {/* Conversion Funnel & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-display text-base font-bold text-[#0B1215] mb-1">
                      Tracked Analytics Events
                    </h3>
                    <p className="text-xs text-slate-500 mb-5">
                      Live interaction breakdown across user journeys
                    </p>
                    <div className="space-y-3">
                      {summary.eventCounts.map((ev) => {
                        const max = Math.max(...summary.eventCounts.map((x) => x.count), 1);
                        const pct = Math.round((ev.count / max) * 100);
                        return (
                          <div key={ev.event_type}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-mono text-slate-700">{ev.event_type}</span>
                              <span className="font-mono font-semibold text-[#0B1215] tabular-nums">
                                {ev.count}
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full bg-[#1D4ED8]"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-display text-base font-bold text-[#0B1215] mb-1">
                      Recent Client &amp; Visitor Activity Stream
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Real-time actions persisted in SQLite analytics log
                    </p>
                    <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                      {summary.analytics.slice(0, 10).map((ev) => (
                        <div
                          key={ev.id}
                          className="py-2.5 flex items-center justify-between gap-4 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 truncate">{ev.label}</p>
                            <p className="text-slate-500 font-mono">
                              {ev.event_type} · {ev.section}
                            </p>
                          </div>
                          <span className="font-mono text-slate-400 whitespace-nowrap shrink-0 tabular-nums">
                            {new Date(ev.created_at).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Leads Tab */}
            {activeTab === 'leads' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-200">
                  <div>
                    <h3 className="font-display text-base font-bold text-[#0B1215]">
                      Client Inquiries ({filteredLeads.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Every submission triggers an email alert to {summary.notificationConfig.ownerEmail}
                    </p>
                  </div>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by name, email, or service..."
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs w-full sm:w-64 focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                {filteredLeads.length === 0 ? (
                  <p className="text-sm text-slate-500 py-8 text-center">
                    No matching inquiries found in this view.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-2.5 pr-4 font-semibold">Client</th>
                          <th className="py-2.5 pr-4 font-semibold">Country &amp; Contact</th>
                          <th className="py-2.5 pr-4 font-semibold">Service Focus</th>
                          <th className="py-2.5 pr-4 font-semibold">Goals / Challenges</th>
                          <th className="py-2.5 font-semibold">Pipeline Stage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredLeads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-slate-50/80">
                            <td className="py-3 pr-4 align-top">
                              <p className="font-semibold text-[#0B1215]">{lead.name}</p>
                              <p className="text-slate-500">{lead.email}</p>
                            </td>
                            <td className="py-3 pr-4 align-top text-slate-600">
                              <p>{lead.country}</p>
                              <p className="font-mono">{lead.phone}</p>
                            </td>
                            <td className="py-3 pr-4 align-top text-slate-700 font-medium">
                              {lead.service_interest}
                            </td>
                            <td className="py-3 pr-4 align-top text-slate-600 max-w-xs">
                              {lead.challenges}
                            </td>
                            <td className="py-3 align-top">
                              <select
                                aria-label={`Status for ${lead.name}`}
                                value={lead.status}
                                onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                                disabled={viewScope === 'client'}
                                className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800"
                              >
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="proposal_sent">Proposal Sent</option>
                                <option value="won">Won</option>
                                <option value="archived">Archived</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-200">
                  <div>
                    <h3 className="font-display text-base font-bold text-[#0B1215]">
                      Consultation Schedule ({filteredAppointments.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Automated slot availability &amp; consultation lifecycle management
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onBookFreeCall}
                    className="px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
                  >
                    + Book Consultation
                  </button>
                </div>

                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm text-slate-600 mb-3">
                      No consultations scheduled under this view yet.
                    </p>
                    <button
                      type="button"
                      onClick={onBookFreeCall}
                      className="px-4 py-2 rounded-lg bg-[#0B1215] text-white text-xs font-semibold cursor-pointer"
                    >
                      Schedule Your Free Appointment
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-2.5 pr-4 font-semibold">Date &amp; Time</th>
                          <th className="py-2.5 pr-4 font-semibold">Client</th>
                          <th className="py-2.5 pr-4 font-semibold">Service Focus</th>
                          <th className="py-2.5 pr-4 font-semibold">Status</th>
                          <th className="py-2.5 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAppointments.map((bk) => (
                          <tr key={bk.id} className="hover:bg-slate-50/80">
                            <td className="py-3 pr-4 font-mono tabular-nums text-[#0B1215]">
                              <p className="font-semibold">
                                {bk.appointment_date} · {bk.appointment_time}
                              </p>
                              <p className="text-slate-500">{bk.timezone}</p>
                            </td>
                            <td className="py-3 pr-4">
                              <p className="font-semibold text-slate-900">{bk.name}</p>
                              <p className="text-slate-500">
                                {bk.email} · {bk.phone}
                              </p>
                            </td>
                            <td className="py-3 pr-4 text-slate-700">{bk.service_interest}</td>
                            <td className="py-3 pr-4 font-medium capitalize text-slate-800">
                              {bk.status}
                            </td>
                            <td className="py-3">
                              <select
                                aria-label={`Appointment status for ${bk.name}`}
                                value={bk.status}
                                onChange={(e) =>
                                  handleUpdateAppointmentStatus(bk.id, e.target.value)
                                }
                                className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800"
                              >
                                <option value="scheduled">Scheduled</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* E2EE Secure Inbox Tab */}
            {activeTab === 'messages' && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
                {/* Thread List */}
                <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 p-4 bg-[#F8FAFC]">
                  <div className="pb-3 mb-3 border-b border-slate-200">
                    <p className="text-xs font-bold text-[#0B1215] flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#1D4ED8]" />
                      End-to-End Encrypted Threads
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 mt-1">
                      Desk Key: {summary.advisorKeyring?.fingerprint}
                    </p>
                  </div>

                  {threads.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4">
                      No encrypted chat threads recorded yet. Use the Encrypted Chat button to
                      start one.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {threads.map((t) => (
                        <button
                          key={t.threadId}
                          type="button"
                          onClick={() => setSelectedThreadId(t.threadId)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                            selectedThreadId === t.threadId
                              ? 'bg-white border-[#0B1215] shadow-xs'
                              : 'bg-transparent border-transparent hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#0B1215] truncate">
                              {t.clientName}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                              {t.count}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {t.clientEmail || t.threadId}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Decrypted Conversation View */}
                <div className="lg:col-span-8 flex flex-col justify-between p-5">
                  <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1">
                    {decryptedMessages
                      .filter((m) => m.threadId === selectedThreadId)
                      .map((m) => (
                        <div
                          key={m.id}
                          className={`p-3.5 rounded-lg border text-xs ${
                            m.senderRole === 'advisor'
                              ? 'bg-[#0B1215] text-white border-[#0B1215] ml-6'
                              : 'bg-[#F8FAFC] text-slate-800 border-slate-200 mr-6'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5 opacity-80 font-mono text-[10px]">
                            <span>
                              {m.senderRole === 'advisor' ? 'GROVIADS Advisor' : m.clientName} ·
                              Key {m.fingerprint}
                            </span>
                            <span>
                              {new Date(m.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="leading-relaxed">{m.plaintext}</p>
                          <p className="mt-2 pt-1.5 border-t border-current/15 font-mono text-[10px] opacity-65 truncate">
                            DB Ciphertext: {m.ciphertextPreview}
                          </p>
                        </div>
                      ))}
                  </div>

                  {selectedThreadId && viewScope === 'agency' && (
                    <form
                      onSubmit={handleSendEncryptedReply}
                      className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-2"
                    >
                      <label htmlFor="advisor-reply" className="sr-only">
                        Send E2EE encrypted advisor reply
                      </label>
                      <input
                        id="advisor-reply"
                        type="text"
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        placeholder="Send encrypted reply to client..."
                        className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#1D4ED8]"
                      />
                      <button
                        type="submit"
                        disabled={sendingReply || !replyDraft.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Encrypt &amp; Reply
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Email Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-200">
                  <div>
                    <h3 className="font-display text-base font-bold text-[#0B1215]">
                      Automated Email Notification Outbox
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Connected Owner Email:{' '}
                      <span className="font-mono font-semibold text-[#0B1215]">
                        {summary.notificationConfig.ownerEmail}
                      </span>{' '}
                      · Company CC:{' '}
                      <span className="font-mono">{summary.notificationConfig.companyEmail}</span> ·
                      Delivery:{' '}
                      {summary.notificationConfig.smtpConfigured
                        ? 'Live SMTP Transport Active'
                        : 'Database Outbox Mode (Add SMTP_HOST/USER/PASS in env for live relay)'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendTestNotification}
                    className="px-4 py-2 rounded-lg bg-[#0B1215] hover:bg-[#16202A] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Send Test Alert Email
                  </button>
                </div>

                {testNotice && (
                  <div className="mb-4 rounded-lg border border-slate-200 bg-[#F8FAFC] px-4 py-2.5 text-xs text-slate-800">
                    {testNotice}
                  </div>
                )}

                <div className="divide-y divide-slate-100">
                  {summary.notifications.map((n) => (
                    <div key={n.id} className="py-3.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-[#0B1215]">{n.subject}</span>
                        <span className="font-mono text-slate-500 tabular-nums">
                          {n.delivery_status} ·{' '}
                          {new Date(n.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-500 mb-1">
                        To: {n.recipient} {n.cc_recipient ? `· CC: ${n.cc_recipient}` : ''} · Type:{' '}
                        {n.event_type}
                      </p>
                      <pre className="whitespace-pre-wrap font-sans text-slate-700 bg-[#F8FAFC] rounded-md p-2.5 border border-slate-200/80 text-[11px] leading-relaxed">
                        {n.body_text}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
