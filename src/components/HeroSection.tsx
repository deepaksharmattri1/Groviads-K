import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck2,
  CheckCircle2,
  Layers,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import {
  COMPANY_INFO,
  PILLARS,
  PORTFOLIO_BLUEPRINTS,
  SERVICE_CATEGORIES,
  type PillarKey,
} from '../data/groviadsProfile';
import type { VisitorProfile } from '../types';
import type { AppRoute } from '../utils/routing';
import {
  BlueprintAnimatedSchematic,
  HeroSystemTopology,
  OperatingModelDiagram,
} from './ArchitecturalGraphics';

interface HeroSectionProps {
  visitor: VisitorProfile | null;
  onNavigate: (route: AppRoute, options?: { pillar?: PillarKey; serviceTitle?: string }) => void;
  onBookFreeCall: (serviceTitle?: string) => void;
}

export function HeroSection({ visitor, onNavigate, onBookFreeCall }: HeroSectionProps) {
  const [selectedPillar, setSelectedPillar] = useState<PillarKey>('technology');
  const [comparisonMode, setComparisonMode] = useState<'unified' | 'siloed'>('unified');

  const isReturningWithoutBooking =
    visitor && visitor.visit_count > 1 && !visitor.has_booked_free_consult;

  const activePillarInfo = PILLARS.find((p) => p.key === selectedPillar) || PILLARS[0];
  const pillarServices = SERVICE_CATEGORIES.filter((s) => s.pillar === selectedPillar);

  return (
    <div>
      {/* Contextual Returning / New Visitor Invitation Bar (non-popup, inline) */}
      <div className="bg-[#070C0E] text-white border-b border-white/10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm">
          <p className="text-slate-300">
            {isReturningWithoutBooking ? (
              <>
                Welcome back{visitor?.name ? `, ${visitor.name}` : ''}. Your complimentary
                30-minute strategy consultation is open to schedule.
              </>
            ) : visitor?.has_booked_free_consult ? (
              <>
                Welcome back{visitor?.name ? `, ${visitor.name}` : ''}. Manage your scheduled
                consultation or encrypted advisor messages anytime.
              </>
            ) : (
              <>
                Global Business Growth &amp; Technology Partner — Free 30-minute initial
                consultation available worldwide.
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() =>
              visitor?.has_booked_free_consult ? onNavigate('/dashboard') : onBookFreeCall()
            }
            className="inline-flex items-center gap-1.5 font-semibold text-[#60A5FA] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
          >
            {visitor?.has_booked_free_consult
              ? 'Open Your Activity Console'
              : 'Reserve Free Appointment'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Creative Dark Obsidian Architectural Hero + Live Topology */}
      <section className="bg-[#0B1215] text-white border-b border-slate-800 relative overflow-hidden">
        {/* Subtle Precision Architectural Backdrop */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(96, 165, 250, 0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(96, 165, 250, 0.14) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-0 w-[560px] h-[560px] rounded-full opacity-25 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(29, 78, 216, 0.55) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-8 pt-12 pb-12 lg:pt-16 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Left Column: Core Proposition */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 flex flex-col justify-between"
            >
              <div>
                <p className="text-xs sm:text-sm font-mono text-[#60A5FA] tracking-wide mb-4">
                  {COMPANY_INFO.positioning} · Worldwide Delivery
                </p>

                <h1
                  className="font-display font-bold tracking-tight text-white leading-[1.06] mb-6 max-w-xl"
                  style={{
                    fontSize: 'clamp(2.25rem, 4.1vw, 3.85rem)',
                    textWrap: 'balance',
                  }}
                >
                  Your Ideas. Our Expertise. Bigger Growth.
                </h1>

                <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mb-8">
                  GROVIADS connects search demand, custom software engineering, business
                  intelligence, and AI automation into one coherent operating system—built for
                  startups, scaling companies, and enterprises worldwide.
                </p>

                <div className="flex flex-wrap items-center gap-4 mb-10">
                  <button
                    type="button"
                    onClick={() => onBookFreeCall()}
                    className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-[#1D4ED8] hover:bg-[#2563EB] text-white font-semibold text-sm sm:text-base transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <CalendarCheck2 className="w-4 h-4" />
                    Schedule Free Discovery Call
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('/services')}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm sm:text-base transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Explore All 9 Services
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1.5 text-white font-medium">
                  <ShieldCheck className="w-4 h-4 text-[#60A5FA] shrink-0" />
                  Problem-first scoping
                </span>
                <span className="sm:border-l sm:border-white/10 sm:pl-4">
                  Written scope before build
                </span>
                <span className="sm:border-l sm:border-white/10 sm:pl-4">
                  E2EE protected advisory
                </span>
              </div>
            </motion.div>

            {/* Right Column: Interactive Animated System Topology + Pillar Switcher */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 flex"
            >
              <div className="w-full rounded-xl bg-[#111B20] text-white p-5 sm:p-6 flex flex-col justify-between border border-white/10">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div
                      role="tablist"
                      aria-label="Preview service pillar"
                      className="grid grid-cols-3 gap-1 p-1 bg-[#070C0E] rounded-lg border border-white/10 w-full sm:w-auto"
                    >
                      {PILLARS.map((pillar) => {
                        const active = selectedPillar === pillar.key;
                        const shortLabel =
                          pillar.key === 'growth'
                            ? 'Growth'
                            : pillar.key === 'technology'
                              ? 'Technology'
                              : 'Intelligence';
                        return (
                          <button
                            key={pillar.key}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setSelectedPillar(pillar.key)}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                              active
                                ? 'bg-[#1D4ED8] text-white'
                                : 'text-slate-300 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {shortLabel}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigate('/services', { pillar: selectedPillar })}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#60A5FA] hover:text-white transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Inspect {activePillarInfo.title}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Interactive Animated Topology SVG */}
                  <HeroSystemTopology
                    activePillar={selectedPillar}
                    onSelectPillar={setSelectedPillar}
                  />

                  {/* Morphing Divisions Preview */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedPillar}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="mt-4"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <h2 className="font-display text-base font-bold text-white">
                          {activePillarInfo.title}
                        </h2>
                        <span className="text-[11px] font-mono text-slate-400">
                          {COMPANY_INFO.followUpSla}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {pillarServices.map((svc) => (
                          <button
                            key={svc.id}
                            type="button"
                            onClick={() => onBookFreeCall(svc.title)}
                            aria-label={`Book free review for ${svc.title}`}
                            className="text-left rounded-lg bg-[#070C0E] hover:bg-[#15232B] border border-white/10 hover:border-[#60A5FA]/50 p-3 transition-colors cursor-pointer group flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[11px] font-mono text-[#60A5FA] tabular-nums">
                                {svc.index}
                              </span>
                              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
                            </div>
                            <p className="text-xs font-semibold text-white leading-snug line-clamp-2">
                              {svc.title}
                            </p>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Full-Width 4-Column Operational Baseline Strip */}
          <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="font-display text-2xl font-bold text-white tabular-nums">9 Lines</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Connected digital marketing, software engineering, BI &amp; automation capabilities
              </p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-white tabular-nums">24 Hours</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Target advisory follow-up across all global time zones after enquiry or booking
              </p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-[#60A5FA] tabular-nums">
                Free 30m
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Initial discovery consultation to evaluate goals before recommending any scope
              </p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-white tabular-nums">AES-256</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Browser-level ECDH P-256 + AES-GCM encrypted messaging with zero server plaintext
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Band 2: Interactive Siloed vs Unified Comparison */}
      <section className="py-16 lg:py-20 bg-white border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-5">
              <p className="text-sm font-semibold text-[#1D4ED8] mb-2">
                Why One Partner Outperforms Fragmented Vendors
              </p>
              <h2
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0B1215] mb-4"
                style={{ textWrap: 'balance' }}
              >
                Align acquisition, software architecture, and analytics under a single accountable roadmap
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Most companies lose momentum between marketing agencies that do not understand code
                and development shops that do not understand conversion telemetry. Toggle the view to
                compare the structural difference.
              </p>

              {/* Interactive Architecture Toggle */}
              <div
                role="tablist"
                aria-label="Compare operating model"
                className="inline-flex flex-wrap p-1 bg-slate-100 rounded-lg border border-slate-200 mb-6 max-w-full"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={comparisonMode === 'unified'}
                  onClick={() => setComparisonMode('unified')}
                  className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    comparisonMode === 'unified'
                      ? 'bg-[#0B1215] text-white'
                      : 'text-slate-600 hover:text-[#0B1215]'
                  }`}
                >
                  Unified GROVIADS
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={comparisonMode === 'siloed'}
                  onClick={() => setComparisonMode('siloed')}
                  className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    comparisonMode === 'siloed'
                      ? 'bg-[#0B1215] text-white'
                      : 'text-slate-600 hover:text-[#0B1215]'
                  }`}
                >
                  Siloed Vendors
                </button>
              </div>

              <ul className="space-y-2.5 text-sm text-slate-700">
                {comparisonMode === 'unified' ? (
                  <>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
                      <span>Direct tracking from paid/search click to database lead and booking.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
                      <span>One written scope linking design, engineering, automation, and BI.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
                      <span>Automated lead triage and calendar reservation with zero dropped inquiries.</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2.5 text-slate-600">
                      <span className="font-mono text-amber-600 font-bold mt-0.5">01</span>
                      <span>Ad agencies optimize clicks while landing pages fail to convert.</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-slate-600">
                      <span className="font-mono text-amber-600 font-bold mt-0.5">02</span>
                      <span>Manual CSV exports between forms, spreadsheets, and sales teams.</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-slate-600">
                      <span className="font-mono text-amber-600 font-bold mt-0.5">03</span>
                      <span>No unified executive telemetry tying spend to pipeline outcomes.</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            <div className="lg:col-span-7">
              <OperatingModelDiagram mode={comparisonMode} />
            </div>
          </div>
        </div>
      </section>

      {/* Band 3: Asymmetric Featured Blueprints Bento + Animated Schematics */}
      <section className="py-16 lg:py-20 bg-[#F8FAFC] border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-[#1D4ED8] mb-2">
                Architecture Blueprints &amp; Creative Systems
              </p>
              <h2
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0B1215]"
                style={{ textWrap: 'balance' }}
              >
                Explore how GROVIADS translates complex challenges into working systems
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/portfolio')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1D4ED8] hover:text-[#1E40AF] whitespace-nowrap shrink-0 cursor-pointer self-start md:self-auto"
            >
              View All 6 Blueprints
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Asymmetric Bento: Marquee Featured Blueprint + Two Companion Blueprints */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
            {PORTFOLIO_BLUEPRINTS.slice(0, 3).map((bp, idx) => {
              const isSpotlight = idx === 0;
              return (
                <motion.article
                  key={bp.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className={`bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between hover:border-[#1D4ED8]/40 transition-colors ${
                    isSpotlight ? 'lg:col-span-6' : 'lg:col-span-3'
                  }`}
                >
                  <div>
                    <BlueprintAnimatedSchematic
                      blueprintId={bp.id}
                      tone={bp.accentTone}
                      index={idx}
                    />
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2.5">
                      <span className="font-semibold text-[#1D4ED8]">{bp.pillarLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{bp.industry}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{bp.timeline}</span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-[#0B1215] mb-2">
                      {bp.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">{bp.solution}</p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-slate-700 truncate">
                      {bp.architectureStack.slice(0, 2).join(' · ')}
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate('/portfolio')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B1215] hover:text-[#1D4ED8] whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Inspect
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>

          {/* 3-Card Multi-Page Quick Entry Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-xl bg-[#0B1215] text-white p-6 flex flex-col justify-between border border-slate-800">
              <div>
                <Layers className="w-5 h-5 text-[#60A5FA] mb-3" />
                <h3 className="font-display text-lg font-bold mb-1.5">
                  Interactive Scope Builder
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-5">
                  Search all 9 service divisions, shortlist deliverables tailored to your stage, and
                  carry your scope directly into a free discovery session.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('/services')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#60A5FA] hover:text-white cursor-pointer self-start"
              >
                Open Services Page
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-6 flex flex-col justify-between">
              <div>
                <CalendarCheck2 className="w-5 h-5 text-[#1D4ED8] mb-3" />
                <h3 className="font-display text-lg font-bold text-[#0B1215] mb-1.5">
                  Automated Calendar Booking
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-5">
                  Check real-time availability across 9 global time zones, lock your free 30-minute
                  appointment, download an `.ics` invite, or manage existing bookings.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('/consultation')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8] hover:text-[#1E40AF] cursor-pointer self-start"
              >
                Open Consultation Page
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-6 flex flex-col justify-between">
              <div>
                <Lock className="w-5 h-5 text-[#1D4ED8] mb-3" />
                <h3 className="font-display text-lg font-bold text-[#0B1215] mb-1.5">
                  Activity Console &amp; E2EE Desk
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-5">
                  Review tracked client analytics, pipeline inquiries, scheduled appointments, email
                  alerts, and browser-decrypted ECDH P-256 conversations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('/dashboard')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8] hover:text-[#1E40AF] cursor-pointer self-start"
              >
                Open Dashboard Console
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
