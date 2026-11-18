import { ArrowRight, ArrowUpRight, CheckCircle2, Search, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import {
  PILLARS,
  PORTFOLIO_BLUEPRINTS,
  type PillarKey,
  type PortfolioBlueprint,
} from '../data/groviadsProfile';
import { BlueprintAnimatedSchematic } from './ArchitecturalGraphics';

interface PortfolioSectionProps {
  onBookForBlueprint: (serviceTitle: string) => void;
  onTrackEvent: (eventType: string, section: string, label: string) => void;
}

export function PortfolioSection({ onBookForBlueprint, onTrackEvent }: PortfolioSectionProps) {
  const [filter, setFilter] = useState<'all' | PillarKey>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBlueprint, setActiveBlueprint] = useState<PortfolioBlueprint | null>(null);

  const industries = useMemo(
    () => Array.from(new Set(PORTFOLIO_BLUEPRINTS.map((b) => b.industry))),
    []
  );

  const items = useMemo(() => {
    return PORTFOLIO_BLUEPRINTS.filter((b) => {
      if (filter !== 'all' && b.pillar !== filter) return false;
      if (industryFilter !== 'all' && b.industry !== industryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          b.title.toLowerCase().includes(q) ||
          b.solution.toLowerCase().includes(q) ||
          b.architectureStack.some((s) => s.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [filter, industryFilter, searchQuery]);

  const handleFilterChange = (next: 'all' | PillarKey) => {
    setFilter(next);
    onTrackEvent('portfolio_filter', 'portfolio', `Filter: ${next}`);
  };

  const isDefaultView = filter === 'all' && industryFilter === 'all' && !searchQuery.trim();

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
            GROVIADS / Portfolio &amp; Solution Blueprints
          </p>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1
                className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight"
                style={{ textWrap: 'balance' }}
              >
                Documented system architectures and growth execution frameworks
              </h1>
              <p className="text-sm sm:text-base text-slate-300 mt-4 leading-relaxed">
                Representative delivery blueprints across software engineering, search optimization,
                automation, and business intelligence—structured around verifiable deliverables.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onBookForBlueprint('Custom Solution Architecture')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#1D4ED8] hover:bg-[#2563EB] text-white text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer self-start lg:self-auto"
            >
              Discuss Your Architecture
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="py-14 lg:py-20 border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
          {/* Interactive Pillar + Industry + Search Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-10">
            <div
              role="tablist"
              aria-label="Filter portfolio blueprints"
              className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/80 rounded-lg self-start"
            >
              <button
                type="button"
                role="tab"
                aria-selected={filter === 'all'}
                onClick={() => handleFilterChange('all')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filter === 'all'
                    ? 'bg-white text-[#0B1215] shadow-xs'
                    : 'text-slate-600 hover:text-[#0B1215]'
                }`}
              >
                All Blueprints ({PORTFOLIO_BLUEPRINTS.length})
              </button>
              {PILLARS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === p.key}
                  onClick={() => handleFilterChange(p.key)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    filter === p.key
                      ? 'bg-white text-[#0B1215] shadow-xs'
                      : 'text-slate-600 hover:text-[#0B1215]'
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div>
                <label htmlFor="portfolio-industry" className="sr-only">
                  Filter by industry
                </label>
                <select
                  id="portfolio-industry"
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="w-full sm:w-48 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#1D4ED8]"
                >
                  <option value="all">All Industries</option>
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative w-full sm:w-64">
                <label htmlFor="portfolio-search" className="sr-only">
                  Search blueprints
                </label>
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="portfolio-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stack or blueprint..."
                  className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>
            </div>
          </div>

          {/* Portfolio Grid with Asymmetric Featured Card */}
          {items.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <p className="text-sm text-slate-600 mb-3">
                No solution blueprints matched the active filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFilter('all');
                  setIndustryFilter('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-lg bg-[#0B1215] text-white text-xs font-semibold cursor-pointer"
              >
                Show All Blueprints
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item, idx) => {
                const isFeatured = isDefaultView && idx === 0;
                return (
                  <motion.article
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.2) }}
                    className={`rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between hover:border-[#1D4ED8]/40 transition-colors ${
                      isFeatured ? 'lg:col-span-2' : ''
                    }`}
                  >
                    <div className={isFeatured ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-center' : ''}>
                      <div className={isFeatured ? 'lg:col-span-6' : ''}>
                        <BlueprintAnimatedSchematic
                          blueprintId={item.id}
                          tone={item.accentTone}
                          index={PORTFOLIO_BLUEPRINTS.findIndex((b) => b.id === item.id)}
                        />
                      </div>

                      <div className={isFeatured ? 'lg:col-span-6' : ''}>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
                          <span className="font-semibold text-[#1D4ED8]">{item.pillarLabel}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.industry}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{item.timeline}</span>
                        </div>

                        <h2 className="font-display text-lg sm:text-xl font-bold text-[#0B1215] mb-2">
                          {item.title}
                        </h2>
                        <p className="text-sm text-slate-600 leading-relaxed mb-4">
                          {item.solution}
                        </p>
                        {isFeatured && (
                          <p className="text-xs text-slate-500 leading-relaxed mb-2">
                            Core Challenge: {item.challenge}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-200">
                      <p className="text-xs font-medium text-slate-800 mb-4">{item.outcomeMetric}</p>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-500 truncate">
                          {item.architectureStack.slice(0, 3).join(' · ')}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveBlueprint(item);
                            onTrackEvent('portfolio_inspect', 'portfolio', item.title);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B1215] hover:text-[#1D4ED8] whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Inspect Scope
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Case Blueprint Detail Modal */}
      {activeBlueprint && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="blueprint-modal-title"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
              <div>
                <p className="text-xs text-slate-500 mb-1">
                  {activeBlueprint.pillarLabel} · {activeBlueprint.clientType} ·{' '}
                  {activeBlueprint.timeline}
                </p>
                <h3
                  id="blueprint-modal-title"
                  className="font-display text-xl sm:text-2xl font-bold text-[#0B1215]"
                >
                  {activeBlueprint.title}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close blueprint modal"
                onClick={() => setActiveBlueprint(null)}
                className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5 text-sm">
              <div>
                <h4 className="font-semibold text-[#0B1215] mb-1">Business Challenge</h4>
                <p className="text-slate-600 leading-relaxed">{activeBlueprint.challenge}</p>
              </div>
              <div>
                <h4 className="font-semibold text-[#0B1215] mb-1">GROVIADS Implementation</h4>
                <p className="text-slate-600 leading-relaxed">{activeBlueprint.solution}</p>
              </div>
              <div>
                <h4 className="font-semibold text-[#0B1215] mb-2">Core Deliverables</h4>
                <ul className="space-y-2">
                  {activeBlueprint.deliverables.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs text-slate-500">
                  Stack: {activeBlueprint.architectureStack.join(' · ')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const title = activeBlueprint.title;
                    setActiveBlueprint(null);
                    onBookForBlueprint(title);
                  }}
                  className="px-5 py-2.5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Book Free Call for Similar Scope
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
