import { CalendarCheck2, CheckCircle2, Lock, Mail, Send } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { COMPANY_INFO, COUNTRIES, SERVICE_CATEGORIES } from '../data/groviadsProfile';
import { validateLeadForm } from '../utils/validation';

interface ContactSectionProps {
  clientId: string;
  selectedScopeServices: string[];
  onLeadSubmitted: (lead: { name: string; email: string; serviceInterest: string }) => void;
  onBookFreeCall: () => void;
  onOpenChat: () => void;
}

export function ContactSection({
  clientId,
  selectedScopeServices,
  onLeadSubmitted,
  onBookFreeCall,
  onOpenChat,
}: ContactSectionProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('United States');
  const [phone, setPhone] = useState('');
  const [serviceInterest, setServiceInterest] = useState(SERVICE_CATEGORIES[0].title);
  const [challenges, setChallenges] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submittedConfirmation, setSubmittedConfirmation] = useState<{
    leadId: string;
    name: string;
    email: string;
    notifiedTo: string;
  } | null>(null);

  useEffect(() => {
    if (selectedScopeServices.length > 0) {
      const matched = SERVICE_CATEGORIES.find((s) => s.title === selectedScopeServices[0]);
      if (matched) setServiceInterest(matched.title);
      if (selectedScopeServices.length > 1 && !challenges) {
        setChallenges(`Interested in combined scope: ${selectedScopeServices.join(', ')}. `);
      }
    }
  }, [selectedScopeServices]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const check = validateLeadForm({
      name,
      email,
      country,
      phone,
      serviceInterest,
      challenges,
    });
    if (!check.valid) {
      setErrors(check.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          name,
          email,
          country,
          phone,
          serviceInterest,
          challenges,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        setServerError(data.error || 'Could not submit inquiry. Please verify your details.');
        return;
      }

      setSubmittedConfirmation({
        leadId: data.lead.id,
        name: data.lead.name,
        email: data.lead.email,
        notifiedTo: data.notification?.recipient || COMPANY_INFO.ownerNotificationEmail,
      });
      onLeadSubmitted({
        name: data.lead.name,
        email: data.lead.email,
        serviceInterest: data.lead.service_interest,
      });
      setName('');
      setEmail('');
      setPhone('');
      setChallenges('');
    } catch {
      setServerError('Network error while saving inquiry. Please try again.');
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
                Every inquiry is stored securely in our relational database, triggers an instant
                owner email alert, and receives an advisory response within 24 hours.
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
                      {COMPANY_INFO.email} · Alerts routed to {COMPANY_INFO.ownerNotificationEmail}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-[#0B1215] mb-1">
                    Why we ask for these details
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Your country and service focus help us assign the right marketing, software, or
                    business intelligence specialist and prepare relevant ideas before speaking.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-[#0B1215] mb-1">Privacy Notice</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Information submitted here is used solely to evaluate your project and coordinate
                    your consultation. We never sell or share client data with third parties.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onBookFreeCall}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B1215] hover:text-[#1D4ED8] transition-colors cursor-pointer"
              >
                <CalendarCheck2 className="w-4 h-4 text-[#1D4ED8]" />
                Prefer to pick a live calendar slot? Book Free Consultation →
              </button>
            </div>

            {/* Right Enquiry Form Column */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
                {submittedConfirmation && (
                  <div
                    role="status"
                    className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-slate-800"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-emerald-950">
                          Thank you, {submittedConfirmation.name}. Your inquiry (
                          {submittedConfirmation.leadId}) has been received.
                        </p>
                        <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
                          The GROVIADS team aims to contact you at {submittedConfirmation.email}{' '}
                          within 24 hours. An instant notification has been dispatched to{' '}
                          {submittedConfirmation.notifiedTo}.
                        </p>
                        <button
                          type="button"
                          onClick={onBookFreeCall}
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B1215] underline underline-offset-4 hover:text-[#1D4ED8] cursor-pointer"
                        >
                          Want an immediate slot? Book your Free 30-Min Appointment now →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {serverError && (
                  <div
                    role="alert"
                    className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                  >
                    {serverError}
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
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rohan Sharma"
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1D4ED8]"
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
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1D4ED8]"
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
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:border-[#1D4ED8]"
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
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 415 555 0199"
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1D4ED8]"
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
                      value={serviceInterest}
                      onChange={(e) => setServiceInterest(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:border-[#1D4ED8]"
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
                      rows={4}
                      value={challenges}
                      onChange={(e) => setChallenges(e.target.value)}
                      placeholder="Briefly describe what you want to achieve, current bottlenecks, and ideal timeline..."
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1D4ED8]"
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
                      {submitting ? 'Submitting Inquiry...' : 'Submit Project Inquiry'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
