import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import {
  COMPANY_INFO,
  DELIVERY_PROCESS,
  INDUSTRIES,
  PILLARS,
  SERVICE_CATEGORIES,
  TARGET_GROUPS,
  type PillarKey,
} from '../data/groviadsProfile';
import { filterItemsByQuery } from '../utils/routing';
import { DeliveryArcDiagram } from './ArchitecturalGraphics';

interface ServicesAndProcessSectionProps {
  initialPillar?: PillarKey | 'all';
  selectedScopeServices: string[];
  onToggleScopeService: (serviceTitle: string) => void;
  onSelectServiceForBooking: (serviceTitle: string) => void;
  onBookWithScope: () => void;
  onEnquireWithScope: () => void;
}

export function ServicesAndProcessSection({
  initialPillar = 'all',
  selectedScopeServices,
  onToggleScopeService,
  onSelectServiceForBooking,
  onBookWithScope,
  onEnquireWithScope,
}: ServicesAndProcessSectionProps) {
  const [selectedPillar, setSelectedPillar] = useState<'all' | PillarKey>(initialPillar);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('digital-marketing');
  const [activeStageIdx, setActiveStageIdx] = useState<number>(1);

  useEffect(() => {
    setSelectedPillar(initialPillar);
  }, [initialPillar]);

  const byPillar =
    selectedPillar === 'all'
      ? SERVICE_CATEGORIES
      : SERVICE_CATEGORIES.filter((s) => s.pillar === selectedPillar);

  const filteredServices = filterItemsByQuery(byPillar, searchQuery);

  return (
    <div className="bg-[#F8FAFC]">
      {/* Dedicated Page Header */}
      <section className="bg-[#0B1215] text-white border-b border-slate-800 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(96, 165, 250, 0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(96, 165, 250, 0.14) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-8 py-12 lg:py-16">
          <p className="text-xs font-mono text-[#60A5FA] mb-3">
            GROVIADS / Capabilities &amp; Delivery Process
          </p>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1
                className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight"
                style={{ textWrap: 'balance' }}
              >
                Nine specialized service divisions unified under three growth pillars
              </h1>
              <p className="text-sm sm:text-base text-slate-300 mt-4 leading-relaxed">
                Filter capabilities, search deliverables, or shortlist multiple service lines into a
                custom scope brief before submitting your project enquiry.
              </p>
            </div>
            <button
              type="button"
              onClick={onEnquireWithScope}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#1D4ED8] hover:bg-[#2563EB] text-white text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer self-start lg:self-auto"
            >
              Send Project Enquiry
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Main Services Explorer */}
      <section className="py-14 lg:py-20 border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
          {/* Interactive Filter + Search Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <div
              role="tablist"
              aria-label="Filter services by pillar"
              className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/80 rounded-lg self-start"
            >
              <button
                type="button"
                role="tab"
                aria-selected={selectedPillar === 'all'}
                onClick={() => setSelectedPillar('all')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedPillar === 'all'
                    ? 'bg-white text-[#0B1215] shadow-xs'
                    : 'text-slate-600 hover:text-[#0B1215]'
                }`}
              >
                All Services (9)
              </button>
              {PILLARS.map((pillar) => (
                <button
                  key={pillar.key}
                  type="button"
                  role="tab"
                  aria-selected={selectedPillar === pillar.key}
                  onClick={() => setSelectedPillar(pillar.key)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedPillar === pillar.key
                      ? 'bg-white text-[#0B1215] shadow-xs'
                      : 'text-slate-600 hover:text-[#0B1215]'
                  }`}
                >
                  {pillar.title}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-80">
              <label htmlFor="service-search" className="sr-only">
                Search services and deliverables
              </label>
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="service-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search deliverables (e.g. GEO, CRM, Shopify)..."
                className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1D4ED8]"
              />
            </div>
          </div>

          {/* Interactive Scope Shortlist Bar */}
          {selectedScopeServices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-8 rounded-xl bg-[#0B1215] text-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800"
            >
              <div className="min-w-0">
                <p className="text-xs font-mono text-[#60A5FA] mb-1">
                  Enquiry Scope Shortlist ({selectedScopeServices.length} selected)
                </p>
                <p className="text-sm font-medium text-slate-100 truncate">
                  {selectedScopeServices.join(' · ')}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={onEnquireWithScope}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-xs font-semibold text-white whitespace-nowrap cursor-pointer"
                >
                  Send Enquiry with Scope
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Service Grid */}
          {filteredServices.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <p className="text-sm text-slate-600 mb-3">
                No service divisions match "{searchQuery}".
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedPillar('all');
                }}
                className="px-4 py-2 rounded-lg bg-[#0B1215] text-white text-xs font-semibold cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
              {filteredServices.map((service, idx) => {
                const isExpanded = expandedId === service.id || searchQuery.trim().length > 0;
                const isShortlisted = selectedScopeServices.includes(service.title);
                const spanClass =
                  selectedPillar === 'all' && !searchQuery && (idx === 0 || idx === 2)
                    ? 'lg:col-span-2'
                    : '';

                return (
                  <motion.article
                    key={service.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.18) }}
                    className={`bg-white rounded-xl border p-6 flex flex-col justify-between transition-colors ${
                      isShortlisted
                        ? 'border-[#1D4ED8] ring-1 ring-[#1D4ED8]/20'
                        : 'border-slate-200 hover:border-slate-300'
                    } ${spanClass}`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-3">
                        <span className="font-mono text-[#1D4ED8] font-medium">
                          {service.index} · {service.pillarLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedId(expandedId === service.id ? null : service.id)}
                          aria-expanded={isExpanded}
                          className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0B1215] font-medium cursor-pointer whitespace-nowrap shrink-0"
                        >
                          {isExpanded ? 'Hide scope' : 'View deliverables'}
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <h2 className="font-display text-lg sm:text-xl font-semibold text-[#0B1215] mb-2">
                        {service.index}. {service.title}
                      </h2>
                      <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        {service.summary}
                      </p>

                      {isExpanded && (
                        <ul className="space-y-2 pt-3 border-t border-slate-100 mb-5 text-sm text-slate-700">
                          {service.deliverables.map((item) => (
                            <li key={item} className="flex items-start gap-2">
                              <span
                                className="text-[#1D4ED8] font-semibold mt-0.5"
                                aria-hidden="true"
                              >
                                —
                              </span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => onToggleScopeService(service.title)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                          isShortlisted
                            ? 'bg-[#1D4ED8] border-[#1D4ED8] text-white'
                            : 'bg-white border-slate-300 text-slate-700 hover:border-[#0B1215]'
                        }`}
                      >
                        {isShortlisted ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Added to Scope
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Add to Scope
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectServiceForBooking(service.title)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B1215] hover:text-[#1D4ED8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Enquire Now
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}

          {/* Core Philosophy + Interactive 7-Step Customer Journey */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-12 border-t border-slate-200">
            <div className="lg:col-span-5">
              <p className="text-sm font-semibold text-[#1D4ED8] mb-2">
                Vision, Philosophy &amp; Who We Serve
              </p>
              <h2
                className="font-display text-2xl font-bold text-[#0B1215] mb-4"
                style={{ textWrap: 'balance' }}
              >
                Understand the business problem before recommending a service
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {COMPANY_INFO.mission}
              </p>

              <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
                <h3 className="text-sm font-semibold text-[#0B1215] mb-3">
                  Five Operating Principles
                </h3>
                <ol className="space-y-2.5 text-sm text-slate-700">
                  {COMPANY_INFO.philosophy.map((line, i) => (
                    <li key={line} className="flex items-start gap-3">
                      <span className="font-mono text-xs text-[#1D4ED8] font-semibold mt-0.5 tabular-nums">
                        0{i + 1}
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                  Industries Supported Worldwide
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {INDUSTRIES.join(' · ')}
                </p>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 mb-5 border-b border-slate-200">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#0B1215]">
                      7-Stage Client Acquisition &amp; Delivery Process
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Every engagement starts with a direct project enquiry and structured scope review.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectServiceForBooking('Business Planning & Strategy')}
                    className="text-xs font-semibold text-[#1D4ED8] hover:text-[#1E40AF] whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
                  >
                    Send Project Enquiry →
                  </button>
                </div>

                {/* Interactive Animated SVG Arc Diagram */}
                <DeliveryArcDiagram
                  activeStep={activeStageIdx}
                  onSelectStep={setActiveStageIdx}
                  steps={DELIVERY_PROCESS}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  {DELIVERY_PROCESS.map((stage, idx) => {
                    const selected = idx === activeStageIdx;
                    return (
                      <button
                        key={stage.step}
                        type="button"
                        onClick={() => setActiveStageIdx(idx)}
                        className={`text-left rounded-lg p-3.5 border transition-colors cursor-pointer ${
                          selected
                            ? 'bg-[#0B1215] text-white border-[#0B1215]'
                            : 'bg-[#F8FAFC] text-slate-900 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <p
                          className={`font-mono text-xs font-semibold mb-1 tabular-nums ${
                            selected ? 'text-[#60A5FA]' : 'text-[#1D4ED8]'
                          }`}
                        >
                          Stage {stage.step}
                        </p>
                        <p
                          className={`font-display text-sm font-semibold mb-1 ${
                            selected ? 'text-white' : 'text-[#0B1215]'
                          }`}
                        >
                          {stage.title}
                        </p>
                        <p
                          className={`text-xs leading-relaxed ${
                            selected ? 'text-slate-300' : 'text-slate-600'
                          }`}
                        >
                          {stage.detail}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 pt-5 border-t border-slate-200">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Tailored Engagement Tracks
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                    {TARGET_GROUPS.slice(0, 4).map((group) => (
                      <div key={group.name}>
                        <span className="font-semibold text-[#0B1215]">{group.name}:</span>{' '}
                        {group.focus}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
