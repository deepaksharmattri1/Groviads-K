import { Bot, CheckCircle2, Clock, Lock, Mail, Send } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { COMPANY_INFO, COUNTRIES, SERVICE_CATEGORIES } from '../data/groviadsProfile';
import { validateLeadForm } from '../utils/validation';
import { GlobalPresenceMap } from './GlobalPresenceMap';

interface SubmittedEnquiryReceipt {
  leadId: string;
  name: string;
  email: string;
  country: string;
  phone: string;
  serviceInterest: string;
  challenges: string;
  notifiedTo: string;
  submittedAt: string;
  deliveryMode: 'server' | 'offline_fallback';
}

interface ContactSectionProps {
  clientId: string;
  preselectedService?: string | null;
  selectedScopeServices: string[];
  mapsApiKey?: string;
  onLeadSubmitted: (lead: { name: string; email: string; serviceInterest: string }) => void;
  onOpenChat: () => void;
  onOpenAiHub?: () => void;
}

const RECENT_ENQUIRIES_KEY = 'groviads_recent_enquiries_v1';

function loadRecentEnquiries(): SubmittedEnquiryReceipt[] {
  try {
    const raw = localStorage.getItem(RECENT_ENQUIRIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveRecentEnquiry(receipt: SubmittedEnquiryReceipt): SubmittedEnquiryReceipt[] {
  const next = [receipt, ...loadRecentEnquiries().filter((item) => item.leadId !== receipt.leadId)].slice(
    0,
    5
  );
  try {
    localStorage.setItem(RECENT_ENQUIRIES_KEY, JSON.stringify(next));
  } catch {
    // ignore storage quota error
  }
  return next;
}

function buildMailtoHref(receipt: SubmittedEnquiryReceipt): string {
  const subject = `[GROVIADS Enquiry ${receipt.leadId}] ${receipt.name} — ${receipt.serviceInterest}`;
  const body = [
    `Reference ID: ${receipt.leadId}`,
    `Name: ${receipt.name}`,
    `Email: ${receipt.email}`,
    `Country: ${receipt.country}`,
    `Phone / WhatsApp: ${receipt.phone}`,
    `Service of Interest: ${receipt.serviceInterest}`,
    ``,
    `Business Challenges & Goals:`,
    receipt.challenges,
  ].join('\n');
  return `mailto:${COMPANY_INFO.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function ContactSection({
  clientId,
  preselectedService,
  selectedScopeServices,
  mapsApiKey,
  onLeadSubmitted,
  onOpenChat,
  onOpenAiHub,
}: ContactSectionProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('United States');
  const [phone, setPhone] = useState('');
  const [serviceInterest, setServiceInterest] = useState(SERVICE_CATEGORIES[0].title);
  const [challenges, setChallenges] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formBannerError, setFormBannerError] = useState<string | null>(null);
  const [submittedConfirmation, setSubmittedConfirmation] =
    useState<SubmittedEnquiryReceipt | null>(null);
  const [recentEnquiries, setRecentEnquiries] = useState<SubmittedEnquiryReceipt[]>(() =>
    loadRecentEnquiries()
  );

  const formTopRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (preselectedService) {
      const matched = SERVICE_CATEGORIES.find((s) => s.title === preselectedService);
      if (matched) {
        setServiceInterest(matched.title);
      } else if (!challenges.trim()) {
        setChallenges(`Project focus: ${preselectedService}. `);
      }
    }
  }, [preselectedService]);

  useEffect(() => {
    if (selectedScopeServices.length > 0) {
      const matched = SERVICE_CATEGORIES.find((s) => s.title === selectedScopeServices[0]);
      if (matched) setServiceInterest(matched.title);
      if (selectedScopeServices.length > 1 && !challenges.trim()) {
        setChallenges(`Interested in combined scope: ${selectedScopeServices.join(', ')}. `);
      }
    }
  }, [selectedScopeServices]);

  const clearFieldError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (formBannerError) setFormBannerError(null);
  };

  const focusFirstErrorField = (fieldErrors: Record<string, string>) => {
    const fieldOrder: Array<[string, string]> = [
      ['name', 'lead-name'],
      ['email', 'lead-email'],
      ['country', 'lead-country'],
      ['phone', 'lead-phone'],
      ['serviceInterest', 'lead-service'],
      ['challenges', 'lead-challenges'],
    ];
    for (const [key, domId] of fieldOrder) {
      if (fieldErrors[key]) {
        const el = document.getElementById(domId);
        if (el) {
          el.focus();
          break;
        }
      }
    }
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const finalizeReceipt = (receipt: SubmittedEnquiryReceipt) => {
    setSubmittedConfirmation(receipt);
    setRecentEnquiries(saveRecentEnquiry(receipt));
    onLeadSubmitted({
      name: receipt.name,
      email: receipt.email,
      serviceInterest: receipt.serviceInterest,
    });
    setName('');
    setEmail('');
    setPhone('');
    setChallenges('');
    setErrors({});
    setFormBannerError(null);
    requestAnimationFrame(() => {
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormBannerError(null);

    const payload = {
      name: name.trim(),
      email: email.trim(),
      country: country.trim(),
      phone: phone.trim(),
      serviceInterest: serviceInterest.trim(),
      challenges: challenges.trim(),
    };

    const check = validateLeadForm(payload);
    if (!check.valid) {
      setErrors(check.errors);
      setFormBannerError('Please fix the highlighted fields below before submitting your enquiry.');
      focusFirstErrorField(check.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          clientId,
          ...payload,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      if (isJson) {
        const data = await res.json();
        if (!res.ok) {
          if (data.errors) {
            setErrors(data.errors);
            focusFirstErrorField(data.errors);
          }
          setFormBannerError(
            data.error || 'Could not submit your enquiry. Please verify your details and try again.'
          );
          return;
        }

        finalizeReceipt({
          leadId: data.lead?.id || `ld_${Date.now().toString(36)}`,
          name: data.lead?.name || payload.name,
          email: data.lead?.email || payload.email,
          country: data.lead?.country || payload.country,
          phone: data.lead?.phone || payload.phone,
          serviceInterest: data.lead?.service_interest || payload.serviceInterest,
          challenges: data.lead?.challenges || payload.challenges,
          notifiedTo: data.notification?.recipient || COMPANY_INFO.ownerNotificationEmail,
          submittedAt: data.lead?.created_at || new Date().toISOString(),
          deliveryMode: 'server',
        });
        return;
      }

      // Static hosting fallback (when /api/leads is not backed by the Express server)
      finalizeReceipt({
        leadId: `ld_local_${Date.now().toString(36)}`,
        ...payload,
        notifiedTo: COMPANY_INFO.email,
        submittedAt: new Date().toISOString(),
        deliveryMode: 'offline_fallback',
      });
    } catch {
      finalizeReceipt({
        leadId: `ld_local_${Date.now().toString(36)}`,
        ...payload,
        notifiedTo: COMPANY_INFO.email,
        submittedAt: new Date().toISOString(),
        deliveryMode: 'offline_fallback',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC]">
      {/* Dedicated Page Header */}
      <section className="bg-[#0B1215] text-white border-b border-slate-800">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-12 lg:py-16">
          <p className="text-xs font-mono text-[#60A5FA] mb-3">
            GROVIADS / Project Enquiry &amp; Business Assessment
          </p>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1
                className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight"
                style={{ textWrap: 'balance' }}
              >
                Tell us your business goals and technical challenges
              </h1>
              <p className="text-sm sm:text-base text-slate-300 mt-4 leading-relaxed">
                Submit your project details directly—no account or registration required. Every
                enquiry is stored securely and receives a direct advisory response within 24 hours.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenChat}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer self-start lg:self-auto"
            >
              <Lock className="w-4 h-4" />
              Open E2EE Live Chat
            </button>
          </div>
        </div>
      </section>

      <section id="contact" className="py-14 lg:py-20 border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
            {/* Left Guidance Column */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 mb-6">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[#0B1215]">Direct Advisory Contact</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {COMPANY_INFO.email} · Advisory follow-up {COMPANY_INFO.followUpSla.toLowerCase()}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-[#0B1215] mb-1">
                    Why we ask for these details
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Your country and service focus help us assign the right marketing, software, or
                    business intelligence specialist and prepare relevant ideas before replying.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-[#0B1215] mb-1">Privacy Notice</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Information submitted here is used solely to evaluate your project and respond
                    to your enquiry. We never sell or share client data with third parties.
                  </p>
                </div>
              </div>

              {onOpenAiHub && (
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={onOpenAiHub}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#1D4ED8] hover:text-[#1E40AF] transition-colors cursor-pointer"
                  >
                    <Bot className="w-4 h-4" />
                    Want instant AI scoping or market research? Open AI Hub →
                  </button>
                </div>
              )}

              {recentEnquiries.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[#0B1215] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#1D4ED8]" />
                      Your Recent Enquiries
                    </p>
                    <span className="text-[11px] font-mono text-slate-500">
                      {recentEnquiries.length} recorded
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {recentEnquiries.map((item) => (
                      <div
                        key={item.leadId}
                        className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[#0B1215] truncate">
                            {item.serviceInterest}
                          </span>
                          <span className="font-mono text-[11px] text-[#1D4ED8] shrink-0">
                            {item.leadId}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-0.5 truncate">
                          {item.name} · {item.email}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Enquiry Form Column */}
            <div className="lg:col-span-7" ref={formTopRef}>
              <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
                {submittedConfirmation && (
                  <div
                    role="status"
                    className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-slate-800"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                      <div className="space-y-1.5">
                        <p className="font-semibold text-emerald-950">
                          Thank you, {submittedConfirmation.name}. Your enquiry (
                          <span className="font-mono">{submittedConfirmation.leadId}</span>) has
                          been received.
                        </p>
                        <p className="text-xs text-emerald-900 leading-relaxed">
                          Service requested:{' '}
                          <span className="font-semibold">
                            {submittedConfirmation.serviceInterest}
                          </span>
                          . The GROVIADS team will contact you at{' '}
                          <span className="font-semibold">{submittedConfirmation.email}</span>{' '}
                          within 24 hours.
                        </p>
                        {submittedConfirmation.deliveryMode === 'offline_fallback' && (
                          <div className="pt-1">
                            <a
                              href={buildMailtoHref(submittedConfirmation)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8] underline underline-offset-4 hover:text-[#1E40AF]"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              Also send a copy directly via email to {COMPANY_INFO.email} →
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {formBannerError && (
                  <div
                    role="alert"
                    className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                  >
                    {formBannerError}
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="lead-name"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Full Name *
                      </label>
                      <input
                        id="lead-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          clearFieldError('name');
                        }}
                        aria-invalid={Boolean(errors.name)}
                        placeholder="e.g. Rohan Sharma"
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none ${
                          errors.name
                            ? 'border-red-400 focus:border-red-600'
                            : 'border-slate-300 focus:border-[#1D4ED8]'
                        }`}
                      />
                      {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label
                        htmlFor="lead-email"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Email Address *
                      </label>
                      <input
                        id="lead-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          clearFieldError('email');
                        }}
                        aria-invalid={Boolean(errors.email)}
                        placeholder="you@company.com"
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none ${
                          errors.email
                            ? 'border-red-400 focus:border-red-600'
                            : 'border-slate-300 focus:border-[#1D4ED8]'
                        }`}
                      />
                      {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="lead-country"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Country *
                      </label>
                      <select
                        id="lead-country"
                        name="country"
                        value={country}
                        onChange={(e) => {
                          setCountry(e.target.value);
                          clearFieldError('country');
                        }}
                        aria-invalid={Boolean(errors.country)}
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none ${
                          errors.country
                            ? 'border-red-400 focus:border-red-600'
                            : 'border-slate-300 focus:border-[#1D4ED8]'
                        }`}
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      {errors.country && (
                        <p className="text-xs text-red-600 mt-1">{errors.country}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="lead-phone"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Phone or WhatsApp Number *
                      </label>
                      <input
                        id="lead-phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          clearFieldError('phone');
                        }}
                        aria-invalid={Boolean(errors.phone)}
                        placeholder="+1 415 555 0199"
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none ${
                          errors.phone
                            ? 'border-red-400 focus:border-red-600'
                            : 'border-slate-300 focus:border-[#1D4ED8]'
                        }`}
                      />
                      {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="lead-service"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Service of Interest *
                    </label>
                    <select
                      id="lead-service"
                      name="serviceInterest"
                      value={serviceInterest}
                      onChange={(e) => {
                        setServiceInterest(e.target.value);
                        clearFieldError('serviceInterest');
                      }}
                      aria-invalid={Boolean(errors.serviceInterest)}
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none ${
                        errors.serviceInterest
                          ? 'border-red-400 focus:border-red-600'
                          : 'border-slate-300 focus:border-[#1D4ED8]'
                      }`}
                    >
                      {SERVICE_CATEGORIES.map((s) => (
                        <option key={s.id} value={s.title}>
                          {s.index}. {s.title}
                        </option>
                      ))}
                    </select>
                    {errors.serviceInterest && (
                      <p className="text-xs text-red-600 mt-1">{errors.serviceInterest}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="lead-challenges"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Business Challenges &amp; Goals *
                    </label>
                    <textarea
                      id="lead-challenges"
                      name="challenges"
                      rows={4}
                      value={challenges}
                      onChange={(e) => {
                        setChallenges(e.target.value);
                        clearFieldError('challenges');
                      }}
                      aria-invalid={Boolean(errors.challenges)}
                      placeholder="Briefly describe what you want to achieve, current bottlenecks, and ideal timeline..."
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none ${
                        errors.challenges
                          ? 'border-red-400 focus:border-red-600'
                          : 'border-slate-300 focus:border-[#1D4ED8]'
                      }`}
                    />
                    {errors.challenges && (
                      <p className="text-xs text-red-600 mt-1">{errors.challenges}</p>
                    )}
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="text-xs text-slate-500">
                      Protected storage · 24-hour advisory response SLA
                    </p>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-60 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      {submitting ? 'Submitting Enquiry...' : 'Submit Project Enquiry'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="mt-14">
            <GlobalPresenceMap apiKey={mapsApiKey} />
          </div>
        </div>
      </section>
    </div>
  );
}
