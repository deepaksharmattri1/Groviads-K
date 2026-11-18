import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFeeBreakdown,
  detectCardBrand,
  generateIcsCalendarContent,
  getAvailableSlotsForDate,
  luhnCheck,
  validateAppointmentForm,
  validateLeadForm,
} from './validation';

test('validateLeadForm enforces required fields and accepts valid input', () => {
  const invalid = validateLeadForm({
    name: 'A',
    email: 'not-an-email',
    country: '',
    phone: '12',
    serviceInterest: '',
    challenges: 'short',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.name);
  assert.ok(invalid.errors.email);
  assert.ok(invalid.errors.country);
  assert.ok(invalid.errors.phone);
  assert.ok(invalid.errors.serviceInterest);
  assert.ok(invalid.errors.challenges);

  const valid = validateLeadForm({
    name: 'Aarav Mehta',
    email: 'aarav@example.com',
    country: 'India',
    phone: '+91 9876543210',
    serviceInterest: 'Software Development & Engineering',
    challenges: 'We need a unified client portal and automated lead follow-up.',
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});
});

test('validateAppointmentForm validates scheduling fields', () => {
  const res = validateAppointmentForm({
    name: 'Elena Rostova',
    email: 'elena@company.io',
    phone: '+44 7700 900077',
    country: 'United Kingdom',
    serviceInterest: 'Digital Marketing & Search Optimization',
    packageId: 'free-consultation',
    appointmentDate: '2026-11-25',
    appointmentTime: '10:00',
    timezone: 'Europe/London (GMT)',
  });
  assert.equal(res.valid, true);
});

test('getAvailableSlotsForDate blocks scheduled slots and preserves cancelled slots', () => {
  const slots = getAvailableSlotsForDate(
    ['09:00', '10:00', '11:30', '14:00'],
    [
      { appointmentDate: '2026-11-25', appointmentTime: '10:00', status: 'scheduled' },
      { appointmentDate: '2026-11-25', appointmentTime: '11:30', status: 'cancelled' },
      { appointmentDate: '2026-11-26', appointmentTime: '09:00', status: 'scheduled' },
    ],
    '2026-11-25'
  );
  assert.deepEqual(slots, [
    { time: '09:00', available: true },
    { time: '10:00', available: false },
    { time: '11:30', available: true },
    { time: '14:00', available: true },
  ]);
});

test('luhnCheck and detectCardBrand validate card numbers accurately', () => {
  assert.equal(luhnCheck('4242 4242 4242 4242'), true);
  assert.equal(luhnCheck('4242 4242 4242 4241'), false);
  assert.equal(detectCardBrand('4242424242424242'), 'Visa');
  assert.equal(detectCardBrand('5555555555554444'), 'Mastercard');
});

test('calculateFeeBreakdown separates GROVIADS service fees from third-party ad spend', () => {
  const free = calculateFeeBreakdown(0, 1000);
  assert.equal(free.payableNowUsd, 0);
  assert.equal(free.processingFeeUsd, 0);
  assert.equal(free.thirdPartyAdBudgetUsd, 1000);

  const paid = calculateFeeBreakdown(490, 2000);
  assert.equal(paid.serviceFeeUsd, 490);
  assert.equal(paid.thirdPartyAdBudgetUsd, 2000);
  assert.ok(paid.payableNowUsd > 490 && paid.payableNowUsd < 510);
});

test('generateIcsCalendarContent produces valid VCALENDAR invite', () => {
  const ics = generateIcsCalendarContent({
    id: 'bk_101',
    name: 'Test Client',
    email: 'client@test.com',
    serviceInterest: 'AI & Business Automation',
    appointmentDate: '2026-11-25',
    appointmentTime: '14:00',
    timezone: 'UTC (GMT+0)',
  });
  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('DTSTART:20261125T140000'));
  assert.ok(ics.includes('DTEND:20261125T143000'));
  assert.ok(ics.includes('SUMMARY:GROVIADS Consultation'));
});
