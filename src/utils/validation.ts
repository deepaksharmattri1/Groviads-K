export interface LeadFormInput {
  name: string;
  email: string;
  country: string;
  phone: string;
  serviceInterest: string;
  challenges: string;
}

export interface AppointmentInput {
  name: string;
  email: string;
  phone: string;
  country: string;
  serviceInterest: string;
  packageId: string;
  appointmentDate: string;
  appointmentTime: string;
  timezone: string;
  notes?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+\d][\d\s().-]{6,20}$/;

export function validateEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function validatePhone(phone: string): boolean {
  return PHONE_RE.test(phone.trim());
}

export function validateLeadForm(input: LeadFormInput): ValidationResult {
  const errors: Record<string, string> = {};
  if (!input.name.trim() || input.name.trim().length < 2) {
    errors.name = 'Please enter your full name (at least 2 characters).';
  }
  if (!validateEmail(input.email)) {
    errors.email = 'Please enter a valid business or personal email address.';
  }
  if (!input.country.trim()) {
    errors.country = 'Please select your country.';
  }
  if (!validatePhone(input.phone)) {
    errors.phone = 'Please enter a valid phone or WhatsApp number with country code.';
  }
  if (!input.serviceInterest.trim()) {
    errors.serviceInterest = 'Please select a service of interest.';
  }
  if (!input.challenges.trim() || input.challenges.trim().length < 10) {
    errors.challenges = 'Please briefly describe your business challenges or goals (10+ characters).';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateAppointmentForm(input: AppointmentInput): ValidationResult {
  const errors: Record<string, string> = {};
  if (!input.name.trim() || input.name.trim().length < 2) {
    errors.name = 'Please enter your full name.';
  }
  if (!validateEmail(input.email)) {
    errors.email = 'Please enter a valid email address for calendar confirmation.';
  }
  if (!validatePhone(input.phone)) {
    errors.phone = 'Please enter a valid phone or WhatsApp number.';
  }
  if (!input.appointmentDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(input.appointmentDate)) {
    errors.appointmentDate = 'Please choose a valid consultation date.';
  }
  if (!input.appointmentTime.trim()) {
    errors.appointmentTime = 'Please select an available time slot.';
  }
  if (!input.timezone.trim()) {
    errors.timezone = 'Please select your preferred time zone.';
  }
  if (!input.serviceInterest.trim()) {
    errors.serviceInterest = 'Please select your primary area of interest.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export function detectCardBrand(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '');
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  if (/^6(?:011|5)/.test(digits)) return 'Discover';
  return 'Card';
}

export function validateCardPayment(input: {
  cardholderName: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
  email: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  if (!input.cardholderName.trim() || input.cardholderName.trim().length < 2) {
    errors.cardholderName = 'Enter the cardholder name.';
  }
  if (!validateEmail(input.email)) {
    errors.email = 'Enter a valid billing email for your receipt.';
  }
  const cleanCard = input.cardNumber.replace(/\D/g, '');
  if (!luhnCheck(cleanCard)) {
    errors.cardNumber = 'Enter a valid card number.';
  }
  const expMatch = input.expiry.trim().match(/^(\d{2})\/(\d{2})$/);
  if (!expMatch) {
    errors.expiry = 'Use MM/YY format.';
  } else {
    const month = parseInt(expMatch[1], 10);
    const year = 2000 + parseInt(expMatch[2], 10);
    if (month < 1 || month > 12) {
      errors.expiry = 'Invalid expiry month.';
    } else {
      const now = new Date();
      const expEnd = new Date(year, month, 0, 23, 59, 59);
      if (expEnd < now) {
        errors.expiry = 'Card has expired.';
      }
    }
  }
  if (!/^\d{3,4}$/.test(input.cvc.trim())) {
    errors.cvc = 'Enter a valid 3 or 4 digit CVC.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function getAvailableSlotsForDate(
  allSlots: string[],
  bookedSlots: { appointmentDate: string; appointmentTime: string; status: string }[],
  targetDate: string
): { time: string; available: boolean }[] {
  const taken = new Set(
    bookedSlots
      .filter((b) => b.appointmentDate === targetDate && b.status !== 'cancelled')
      .map((b) => b.appointmentTime)
  );
  return allSlots.map((time) => ({
    time,
    available: !taken.has(time),
  }));
}

export function calculateFeeBreakdown(serviceFeeUsd: number, thirdPartyAdBudgetUsd = 0) {
  const cleanService = Math.max(0, Math.round(serviceFeeUsd * 100) / 100);
  const cleanAdBudget = Math.max(0, Math.round(thirdPartyAdBudgetUsd * 100) / 100);
  const processingFeeUsd = cleanService > 0 ? Math.round((cleanService * 0.029 + 0.3) * 100) / 100 : 0;
  return {
    serviceFeeUsd: cleanService,
    thirdPartyAdBudgetUsd: cleanAdBudget,
    processingFeeUsd,
    payableNowUsd: Math.round((cleanService + processingFeeUsd) * 100) / 100,
    totalEstimatedCommitmentUsd: Math.round((cleanService + processingFeeUsd + cleanAdBudget) * 100) / 100,
  };
}

export function generateIcsCalendarContent(booking: {
  id: string;
  name: string;
  email: string;
  serviceInterest: string;
  appointmentDate: string;
  appointmentTime: string;
  timezone: string;
}): string {
  const dateCompact = booking.appointmentDate.replace(/-/g, '');
  const [hh, mm] = booking.appointmentTime.split(':').map((n) => parseInt(n, 10));
  const startStr = `${String(hh).padStart(2, '0')}${String(mm).padStart(2, '0')}00`;
  const endMinutes = hh * 60 + mm + 30;
  const endH = Math.floor(endMinutes / 60) % 24;
  const endM = endMinutes % 60;
  const endStr = `${String(endH).padStart(2, '0')}${String(endM).padStart(2, '0')}00`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GROVIADS//Automated Scheduling//EN',
    'BEGIN:VEVENT',
    `UID:groviads-${booking.id}@groviads.com`,
    `DTSTAMP:${dateCompact}T${startStr}Z`,
    `DTSTART:${dateCompact}T${startStr}`,
    `DTEND:${dateCompact}T${endStr}`,
    `SUMMARY:GROVIADS Consultation — ${booking.serviceInterest}`,
    `DESCRIPTION:Client: ${booking.name} (${booking.email}) | Timezone: ${booking.timezone} | Contact: contact@groviads.com`,
    'ORGANIZER;CN=GROVIADS Advisory:mailto:contact@groviads.com',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function getNextBusinessDates(count = 7, fromDate = new Date()): string[] {
  const dates: string[] = [];
  const cursor = new Date(fromDate.getTime());
  cursor.setDate(cursor.getDate() + 1);
  while (dates.length < count) {
    const day = cursor.getDay();
    if (day !== 0) {
      const yyyy = cursor.getFullYear();
      const mm = String(cursor.getMonth() + 1).padStart(2, '0');
      const dd = String(cursor.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}
