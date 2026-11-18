import {
  Calendar,
  CheckCircle2,
  Download,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import {
  COMPANY_INFO,
  COUNTRIES,
  SERVICE_CATEGORIES,
  TIMEZONES,
} from '../data/groviadsProfile';
import type { AppointmentRecord, VisitorProfile } from '../types';
import {
  generateIcsCalendarContent,
  getNextBusinessDates,
  validateAppointmentForm,
} from '../utils/validation';

interface BookingAndPaymentSectionProps {
  clientId: string;
  preselectedService: string | null;
  selectedScopeServices: string[];
  visitor: VisitorProfile | null;
  onVisitorIdentified: (visitor: VisitorProfile) => void;
  onAppointmentBooked: (appointment: AppointmentRecord) => void;
}

export function BookingAndPaymentSection({
  clientId,
  preselectedService,
  selectedScopeServices,
  visitor,
  onVisitorIdentified,
  onAppointmentBooked,
}: BookingAndPaymentSectionProps) {
  const availableDates = getNextBusinessDates(6);
  const [selectedDate, setSelectedDate] = useState(availableDates[0]);
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');

  // Booking form state
  const [name, setName] = useState(visitor?.name || '');
  const [email, setEmail] = useState(visitor?.email || '');
  const [phone, setPhone] = useState(visitor?.phone || '');
  const [country, setCountry] = useState(visitor?.country || 'United States');
  const [timezone, setTimezone] = useState(TIMEZONES[0]);
  const [serviceInterest, setServiceInterest] = useState(
    preselectedService || SERVICE_CATEGORIES[0].title
  );
  const [notes, setNotes] = useState('');
  const [bookingErrors, setBookingErrors] = useState<Record<string, string>>({});
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingServerError, setBookingServerError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<AppointmentRecord | null>(null);
  const [confirmedRecipient, setConfirmedRecipient] = useState<string>(
    COMPANY_INFO.ownerNotificationEmail
  );

  // Returning / Existing User Identify + Manage Bookings
  const [existingUserEmail, setExistingUserEmail] = useState('');
  const [identifyStatus, setIdentifyStatus] = useState<string | null>(null);
  const [userAppointments, setUserAppointments] = useState<AppointmentRecord[]>([]);

  useEffect(() => {
    if (preselectedService) {
      const matched = SERVICE_CATEGORIES.find((s) => s.title === preselectedService);
      if (matched) {
        setServiceInterest(matched.title);
      } else {
        setNotes((prev) => (prev ? prev : `Focus topic: ${preselectedService}`));
      }
    }
  }, [preselectedService]);

  useEffect(() => {
    if (selectedScopeServices.length > 0) {
      const matched = SERVICE_CATEGORIES.find((s) => s.title === selectedScopeServices[0]);
      if (matched) setServiceInterest(matched.title);
      if (selectedScopeServices.length > 1) {
        setNotes(`Shortlisted scope: ${selectedScopeServices.join(', ')}`);
      }
    }
  }, [selectedScopeServices]);

  useEffect(() => {
    if (visitor?.name && !name) setName(visitor.name);
    if (visitor?.email && !email) setEmail(visitor.email);
    if (visitor?.phone && !phone) setPhone(visitor.phone);
    if (visitor?.country) setCountry(visitor.country);
  }, [visitor]);

  const fetchAvailability = async (date: string) => {
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/appointments/availability?date=${encodeURIComponent(date)}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.slots)) {
        setSlots(data.slots);
        const firstOpen = data.slots.find((s: { available: boolean }) => s.available);
        setSelectedTime(firstOpen ? firstOpen.time : '');
      }
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchAvailability(selectedDate);
  }, [selectedDate]);

  const fetchAppointmentsForEmail = async (lookupEmail: string) => {
    try {
      const res = await fetch(`/api/appointments?email=${encodeURIComponent(lookupEmail)}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.appointments)) {
        setUserAppointments(data.appointments);
      }
    } catch {
      // ignore lookup list failure
    }
  };

  const handleIdentifyReturningUser = async () => {
    if (!existingUserEmail.trim()) return;
    setIdentifyStatus('Checking existing profile...');
    try {
      const clean = existingUserEmail.trim();
      const res = await fetch('/api/visitors/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          email: clean,
          name: name || undefined,
          country,
          phone: phone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIdentifyStatus(data.error || 'Please enter a valid email.');
        return;
      }
      if (data.visitor) {
        onVisitorIdentified(data.visitor);
      }
      setEmail(clean);
      await fetchAppointmentsForEmail(clean);

      if (data.hasBookedConsultation) {
        setIdentifyStatus(
          'Profile recognized — your scheduled consultations are listed below. You can also book an additional slot.'
        );
      } else {
        setIdentifyStatus(
          'Welcome back! You have not scheduled your complimentary 30-minute consultation yet — pick an open slot below.'
        );
      }
    } catch {
      setIdentifyStatus('Could not verify profile right now.');
    }
  };

  const handleCancelExistingBooking = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/appointments/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (res.ok) {
        if (existingUserEmail.trim()) {
          await fetchAppointmentsForEmail(existingUserEmail.trim());
        }
        await fetchAvailability(selectedDate);
      }
    } catch {
      // ignore transient error
    }
  };

  const handleBookAppointment = async (e: FormEvent) => {
    e.preventDefault();
    setBookingServerError(null);
    const check = validateAppointmentForm({
      name,
      email,
      phone,
      country,
      serviceInterest,
      packageId: 'free-consultation',
      appointmentDate: selectedDate,
      appointmentTime: selectedTime,
      timezone,
      notes,
    });
    if (!check.valid) {
      setBookingErrors(check.errors);
      return;
    }
    setBookingErrors({});
    setBookingSubmitting(true);

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          name,
          email,
          phone,
          country,
          serviceInterest,
          packageId: 'free-consultation',
          appointmentDate: selectedDate,
          appointmentTime: selectedTime,
          timezone,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setBookingErrors(data.errors);
        setBookingServerError(data.error || 'Unable to confirm appointment.');
        await fetchAvailability(selectedDate);
        return;
      }

      setConfirmedBooking(data.appointment);
      if (data.notification?.recipient) {
        setConfirmedRecipient(data.notification.recipient);
      }
      onAppointmentBooked(data.appointment);
      await fetchAvailability(selectedDate);
      if (email.trim()) {
        await fetchAppointmentsForEmail(email.trim());
      }
    } catch {
      setBookingServerError('Network error while scheduling appointment.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleDownloadIcs = (booking: AppointmentRecord) => {
    const ics = generateIcsCalendarContent({
      id: booking.id,
      name: booking.name,
      email: booking.email,
      serviceInterest: booking.service_interest,
      appointmentDate: booking.appointment_date,
      appointmentTime: booking.appointment_time,
      timezone: booking.timezone,
    });
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `groviads-consultation-${booking.appointment_date}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#F8FAFC]">
      {/* Dedicated Page Header */}
      <section className="bg-[#0B1215] text-white border-b border-slate-800">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-12 lg:py-16">
          <p className="text-xs font-mono text-[#60A5FA] mb-3">
            GROVIADS / Automated Consultation Scheduling
          </p>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <h1
                className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight"
                style={{ textWrap: 'balance' }}
              >
                Book your complimentary 30-minute strategy appointment
              </h1>
              <p className="text-sm sm:text-base text-slate-300 mt-4 leading-relaxed">
                Every new and returning user is invited to reserve a free discovery consultation.
                Slots check live database availability across global time zones and dispatch
                instant calendar confirmations.
              </p>
            </div>

            {/* Returning / Existing User Quick Prompt */}
            <div className="bg-[#111B20] border border-white/15 rounded-xl p-4 w-full lg:w-[410px]">
              <div className="flex items-center gap-2 text-xs font-semibold text-white mb-2">
                <UserCheck className="w-4 h-4 text-[#60A5FA]" />
                <span>Existing User? Check or Manage Your Free Booking</span>
              </div>
              <div className="flex gap-2">
                <label htmlFor="existing-user-email" className="sr-only">
                  Existing user email
                </label>
                <input
                  id="existing-user-email"
                  type="email"
                  value={existingUserEmail}
                  onChange={(e) => setExistingUserEmail(e.target.value)}
                  placeholder="Enter your email..."
                  className="flex-1 min-w-0 rounded-lg border border-white/15 bg-[#0B1215] px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-[#60A5FA]"
                />
                <button
                  type="button"
                  onClick={handleIdentifyReturningUser}
                  className="px-3.5 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Verify
                </button>
              </div>
              {identifyStatus && (
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">{identifyStatus}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="consultation" className="py-14 lg:py-20 border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
          {/* Self-Service Existing Bookings Drawer when verified */}
          {userAppointments.length > 0 && (
            <div className="mb-8 bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-display text-base font-bold text-[#0B1215] mb-3">
                Your Scheduled Consultations ({userAppointments.length})
              </h2>
              <div className="divide-y divide-slate-100">
                {userAppointments.map((bk) => (
                  <div
                    key={bk.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-[#0B1215]">
                        {bk.appointment_date} · {bk.appointment_time} ({bk.timezone})
                      </p>
                      <p className="text-slate-600 mt-0.5">
                        {bk.service_interest} · Status:{' '}
                        <span className="font-semibold capitalize">{bk.status}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownloadIcs(bk)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 font-semibold text-slate-700 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        .ics Invite
                      </button>
                      {bk.status === 'scheduled' && (
                        <button
                          type="button"
                          onClick={() => handleCancelExistingBooking(bk.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 font-semibold text-red-700 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancel Slot
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Slot Selector Column */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#1D4ED8]" />
                  <h2 className="font-display text-base font-bold text-[#0B1215]">
                    1. Select Date &amp; Time Slot
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-500">30 Min · Free</span>
              </div>

              <div className="mb-5">
                <label
                  htmlFor="booking-timezone"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Your Time Zone
                </label>
                <select
                  id="booking-timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#1D4ED8]"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-5">
                <span className="block text-xs font-semibold text-slate-700 mb-2">
                  Available Business Days
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {availableDates.map((d) => {
                    const parsed = new Date(`${d}T12:00:00`);
                    const dayLabel = parsed.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    });
                    const active = selectedDate === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSelectedDate(d)}
                        className={`px-2.5 py-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer tabular-nums ${
                          active
                            ? 'bg-[#0B1215] border-[#0B1215] text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {dayLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-700 mb-2">
                  Open Time Slots ({selectedDate})
                </span>
                {loadingSlots ? (
                  <p className="text-xs text-slate-500 py-4">Checking live availability...</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((slot) => {
                      const active = selectedTime === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`px-3 py-2.5 rounded-lg border text-xs font-mono font-medium transition-colors tabular-nums ${
                            !slot.available
                              ? 'bg-slate-100 border-slate-200 text-slate-400 line-through cursor-not-allowed'
                              : active
                                ? 'bg-[#1D4ED8] border-[#1D4ED8] text-white cursor-pointer'
                                : 'bg-white border-slate-200 text-slate-800 hover:border-[#0B1215] cursor-pointer'
                          }`}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                )}
                {bookingErrors.appointmentTime && (
                  <p className="text-xs text-red-600 mt-2">{bookingErrors.appointmentTime}</p>
                )}
              </div>
            </div>

            {/* Booking Details Column */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
              <div className="pb-4 mb-5 border-b border-slate-200 flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-[#0B1215]">
                  2. Confirm Your Details
                </h2>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  {selectedDate} · {selectedTime || 'Select slot'}
                </span>
              </div>

              {selectedScopeServices.length > 0 && (
                <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3 text-xs text-slate-800">
                  <span className="font-semibold text-[#1E40AF]">Carried-over scope: </span>
                  {selectedScopeServices.join(' · ')}
                </div>
              )}

              {confirmedBooking && (
                <div
                  role="status"
                  className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-slate-800"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-emerald-950">
                        Consultation Confirmed ({confirmedBooking.id})
                      </p>
                      <p className="text-xs text-emerald-900 mt-1">
                        Scheduled for {confirmedBooking.appointment_date} at{' '}
                        {confirmedBooking.appointment_time} ({confirmedBooking.timezone}). Instant
                        notification sent to {confirmedRecipient} and {confirmedBooking.email}.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleDownloadIcs(confirmedBooking)}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-emerald-300 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Calendar Invite (.ics)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {bookingServerError && (
                <div
                  role="alert"
                  className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800"
                >
                  {bookingServerError}
                </div>
              )}

              <form onSubmit={handleBookAppointment} noValidate className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="bk-name"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Your Name *
                    </label>
                    <input
                      id="bk-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#1D4ED8]"
                    />
                    {bookingErrors.name && (
                      <p className="text-xs text-red-600 mt-1">{bookingErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="bk-email"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Email Address *
                    </label>
                    <input
                      id="bk-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#1D4ED8]"
                    />
                    {bookingErrors.email && (
                      <p className="text-xs text-red-600 mt-1">{bookingErrors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="bk-phone"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Phone / WhatsApp *
                    </label>
                    <input
                      id="bk-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+44 7700 900077"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#1D4ED8]"
                    />
                    {bookingErrors.phone && (
                      <p className="text-xs text-red-600 mt-1">{bookingErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="bk-country"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Country *
                    </label>
                    <select
                      id="bk-country"
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
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="bk-service"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Consultation Focus *
                  </label>
                  <select
                    id="bk-service"
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
                </div>

                <div>
                  <label
                    htmlFor="bk-notes"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Agenda Notes (Optional)
                  </label>
                  <input
                    id="bk-notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Key goals or website URL to review during our call"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <span className="text-xs text-slate-500">
                    Free initial session · Automated email confirmation
                  </span>
                  <button
                    type="submit"
                    disabled={bookingSubmitting || !selectedTime}
                    className="px-6 py-3 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-60 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {bookingSubmitting
                      ? 'Confirming Slot...'
                      : 'Confirm Free Consultation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
