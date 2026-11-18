import { motion } from 'motion/react';
import type { PillarKey, PortfolioBlueprint } from '../data/groviadsProfile';

/**
 * Interactive vector architecture schematic for the Home Hero.
 * Reacts directly to the active pillar ('growth' | 'technology' | 'intelligence')
 * and animates real data flow paths between client acquisition, core platforms, and BI automation.
 */
export function HeroSystemTopology({
  activePillar,
  onSelectPillar,
}: {
  activePillar: PillarKey;
  onSelectPillar: (pillar: PillarKey) => void;
}) {
  const nodes: {
    key: PillarKey;
    code: string;
    label: string;
    sub: string;
    cx: number;
    cy: number;
  }[] = [
    {
      key: 'growth',
      code: '01',
      label: 'Demand & Search Engine',
      sub: 'SEO · GEO · Performance',
      cx: 96,
      cy: 84,
    },
    {
      key: 'technology',
      code: '02',
      label: 'Platform & Software Core',
      sub: 'Web · Mobile · APIs',
      cx: 260,
      cy: 168,
    },
    {
      key: 'intelligence',
      code: '03',
      label: 'BI & AI Automation Loop',
      sub: 'Telemetry · Workflows',
      cx: 424,
      cy: 84,
    },
  ];

  const activeNode = nodes.find((n) => n.key === activePillar) || nodes[1];

  return (
    <div className="relative rounded-xl bg-[#070C0E] border border-white/10 p-4 sm:p-5 overflow-hidden">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-[11px] font-mono text-slate-400 tracking-wide">
          GROVIADS Unified Growth Topology
        </span>
        <span className="text-[11px] font-mono text-[#60A5FA] tabular-nums">
          Focus · {activeNode.label}
        </span>
      </div>

      <svg
        viewBox="0 0 520 250"
        className="w-full h-auto block"
        role="img"
        aria-label="Interactive GROVIADS architecture topology connecting demand acquisition, software platforms, and intelligence automation"
      >
        <defs>
          <linearGradient id="cobaltPathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.4" />
          </linearGradient>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Subtle Architectural Grid Lines */}
        <g stroke="#1E293B" strokeWidth="0.75" opacity="0.65">
          <line x1="20" y1="50" x2="500" y2="50" />
          <line x1="20" y1="125" x2="500" y2="125" />
          <line x1="20" y1="200" x2="500" y2="200" />
          <line x1="96" y1="24" x2="96" y2="232" />
          <line x1="260" y1="24" x2="260" y2="232" />
          <line x1="424" y1="24" x2="424" y2="232" />
        </g>

        {/* Ambient Focus Halo */}
        <motion.circle
          cx={activeNode.cx}
          cy={activeNode.cy}
          r="72"
          fill="url(#nodeGlow)"
          animate={{ cx: activeNode.cx, cy: activeNode.cy }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Primary Signal Conduits */}
        <path
          d="M 96 84 C 156 84, 184 168, 260 168"
          fill="none"
          stroke="#1E3A5F"
          strokeWidth="2"
        />
        <path
          d="M 260 168 C 336 168, 364 84, 424 84"
          fill="none"
          stroke="#1E3A5F"
          strokeWidth="2"
        />
        <path
          d="M 424 84 C 340 28, 180 28, 96 84"
          fill="none"
          stroke="#1E293B"
          strokeWidth="1.5"
        />

        {/* Animated Active Data Flow */}
        <path
          d="M 96 84 C 156 84, 184 168, 260 168"
          fill="none"
          stroke={activePillar === 'growth' || activePillar === 'technology' ? '#60A5FA' : '#334155'}
          strokeWidth="2.2"
          className="animate-signal-flow"
        />
        <path
          d="M 260 168 C 336 168, 364 84, 424 84"
          fill="none"
          stroke={
            activePillar === 'technology' || activePillar === 'intelligence' ? '#60A5FA' : '#334155'
          }
          strokeWidth="2.2"
          className="animate-signal-flow"
        />
        <path
          d="M 424 84 C 340 28, 180 28, 96 84"
          fill="none"
          stroke={activePillar === 'intelligence' || activePillar === 'growth' ? '#60A5FA' : '#1E293B'}
          strokeWidth="1.6"
          className="animate-signal-flow-slow"
        />

        {/* Base Output Bus */}
        <line x1="60" y1="222" x2="460" y2="222" stroke="#1E293B" strokeWidth="1.5" />
        <motion.line
          x1="60"
          y1="222"
          x2="460"
          y2="222"
          stroke="url(#cobaltPathGrad)"
          strokeWidth="2.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Interactive Clickable Pillar Nodes */}
        {nodes.map((node) => {
          const isActive = node.key === activePillar;
          return (
            <g
              key={node.key}
              onClick={() => onSelectPillar(node.key)}
              className="cursor-pointer focus:outline-none"
              role="button"
              tabIndex={0}
              aria-label={`Select ${node.label}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPillar(node.key);
                }
              }}
            >
              {isActive && (
                <motion.circle
                  cx={node.cx}
                  cy={node.cy}
                  r="34"
                  fill="none"
                  stroke="#60A5FA"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 0.9, scale: 1 }}
                  transition={{ duration: 0.25 }}
                />
              )}
              <rect
                x={node.cx - 78}
                y={node.cy - 26}
                width="156"
                height="52"
                rx="8"
                fill={isActive ? '#111F2E' : '#0D151B'}
                stroke={isActive ? '#60A5FA' : '#263544'}
                strokeWidth={isActive ? '1.6' : '1'}
              />
              <text
                x={node.cx - 64}
                y={node.cy - 5}
                fill={isActive ? '#60A5FA' : '#94A3B8'}
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="600"
              >
                {node.code} · PILLAR
              </text>
              <text
                x={node.cx - 64}
                y={node.cy + 12}
                fill="#FFFFFF"
                fontSize="11.5"
                fontFamily="Outfit, sans-serif"
                fontWeight="600"
              >
                {node.key === 'growth'
                  ? 'Growth & Visibility'
                  : node.key === 'technology'
                    ? 'Tech & Engineering'
                    : 'Intelligence & AI'}
              </text>
            </g>
          );
        })}

        {/* Outcome Telemetry Strip inside Graphic */}
        <g>
          <rect x="130" y="207" width="260" height="28" rx="6" fill="#0B1215" stroke="#263544" />
          <text
            x="260"
            y="225"
            textAnchor="middle"
            fill="#E2E8F0"
            fontSize="10.5"
            fontFamily="JetBrains Mono, monospace"
          >
            Unified Outcome: {activeNode.sub}
          </text>
        </g>
      </svg>
    </div>
  );
}

/**
 * Interactive Before/With GROVIADS architecture diagram for the Home Proof section.
 */
export function OperatingModelDiagram({ mode }: { mode: 'siloed' | 'unified' }) {
  const isUnified = mode === 'unified';

  return (
    <div className="rounded-xl bg-[#0B1215] border border-slate-800 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <p className="text-xs font-mono text-slate-400">
          System Topology Comparison
        </p>
        <p className={`text-xs font-mono ${isUnified ? 'text-[#60A5FA]' : 'text-amber-400'}`}>
          {isUnified ? 'One Accountable Team' : 'Disconnected Vendors'}
        </p>
      </div>

      <svg
        viewBox="0 0 480 210"
        className="w-full h-auto block"
        role="img"
        aria-label={
          isUnified
            ? 'Unified GROVIADS pipeline connecting marketing, software, and analytics'
            : 'Fragmented multi-vendor workflow with disconnected handoffs'
        }
      >
        <g stroke="#1E293B" strokeWidth="0.75">
          <line x1="16" y1="52" x2="464" y2="52" />
          <line x1="16" y1="105" x2="464" y2="105" />
          <line x1="16" y1="158" x2="464" y2="158" />
        </g>

        {isUnified ? (
          <>
            {/* Connected Pathways */}
            <path
              d="M 140 52 L 200 105 L 140 158"
              fill="none"
              stroke="#60A5FA"
              strokeWidth="2"
              className="animate-signal-flow"
            />
            <path
              d="M 280 105 L 340 52 M 280 105 L 340 158"
              fill="none"
              stroke="#60A5FA"
              strokeWidth="2"
              className="animate-signal-flow"
            />
            <rect x="24" y="30" width="118" height="44" rx="6" fill="#111B20" stroke="#3B82F6" />
            <text x="83" y="50" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="600">
              SEO &amp; Paid Demand
            </text>
            <text x="83" y="64" textAnchor="middle" fill="#94A3B8" fontSize="9.5">
              Tracked attribution
            </text>

            <rect x="24" y="136" width="118" height="44" rx="6" fill="#111B20" stroke="#3B82F6" />
            <text x="83" y="156" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="600">
              Web &amp; App UX
            </text>
            <text x="83" y="170" textAnchor="middle" fill="#94A3B8" fontSize="9.5">
              Fast conversion path
            </text>

            <motion.rect
              x="185"
              y="78"
              width="110"
              height="54"
              rx="8"
              fill="#1D4ED8"
              initial={{ scale: 0.94, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
            />
            <text x="240" y="102" textAnchor="middle" fill="#FFFFFF" fontSize="11.5" fontWeight="700">
              GROVIADS Core
            </text>
            <text x="240" y="118" textAnchor="middle" fill="#DBEAFE" fontSize="9.5">
              CRM + BI + API Sync
            </text>

            <rect x="338" y="30" width="118" height="44" rx="6" fill="#111B20" stroke="#60A5FA" />
            <text x="397" y="50" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="600">
              AI Lead Routing
            </text>
            <text x="397" y="64" textAnchor="middle" fill="#60A5FA" fontSize="9.5">
              Zero dropped leads
            </text>

            <rect x="338" y="136" width="118" height="44" rx="6" fill="#111B20" stroke="#60A5FA" />
            <text x="397" y="156" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="600">
              Decision Analytics
            </text>
            <text x="397" y="170" textAnchor="middle" fill="#60A5FA" fontSize="9.5">
              Real revenue ROI
            </text>
          </>
        ) : (
          <>
            {/* Fragmented Gaps */}
            <line
              x1="142"
              y1="52"
              x2="188"
              y2="52"
              stroke="#64748B"
              strokeWidth="1.5"
              strokeDasharray="3 5"
            />
            <line
              x1="142"
              y1="158"
              x2="188"
              y2="158"
              stroke="#64748B"
              strokeWidth="1.5"
              strokeDasharray="3 5"
            />
            <text x="166" y="45" textAnchor="middle" fill="#F59E0B" fontSize="12" fontWeight="700">
              ×
            </text>
            <text x="166" y="151" textAnchor="middle" fill="#F59E0B" fontSize="12" fontWeight="700">
              ×
            </text>

            <rect x="24" y="30" width="118" height="44" rx="6" fill="#13191D" stroke="#334155" />
            <text x="83" y="50" textAnchor="middle" fill="#CBD5E1" fontSize="11" fontWeight="600">
              Ad Agency
            </text>
            <text x="83" y="64" textAnchor="middle" fill="#64748B" fontSize="9.5">
              Vanity click reports
            </text>

            <rect x="24" y="136" width="118" height="44" rx="6" fill="#13191D" stroke="#334155" />
            <text x="83" y="156" textAnchor="middle" fill="#CBD5E1" fontSize="11" fontWeight="600">
              Freelance Dev
            </text>
            <text x="83" y="170" textAnchor="middle" fill="#64748B" fontSize="9.5">
              No conversion tracking
            </text>

            <rect x="192" y="78" width="118" height="54" rx="6" fill="#1A1512" stroke="#92400E" />
            <text x="251" y="102" textAnchor="middle" fill="#FCD34D" fontSize="11" fontWeight="600">
              Manual Spreadsheets
            </text>
            <text x="251" y="118" textAnchor="middle" fill="#94A3B8" fontSize="9.5">
              Slow handoffs &amp; leaks
            </text>

            <rect x="338" y="78" width="118" height="54" rx="6" fill="#13191D" stroke="#334155" />
            <text x="397" y="102" textAnchor="middle" fill="#94A3B8" fontSize="11" fontWeight="600">
              Delayed Follow-Up
            </text>
            <text x="397" y="118" textAnchor="middle" fill="#64748B" fontSize="9.5">
              Unclear attribution
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

/**
 * Interactive 7-Stage Delivery Arc visualization for the Services & Process page.
 */
export function DeliveryArcDiagram({
  activeStep,
  onSelectStep,
  steps,
}: {
  activeStep: number;
  onSelectStep: (index: number) => void;
  steps: { step: string; title: string }[];
}) {
  const progressRatio = (activeStep + 1) / steps.length;

  return (
    <div className="rounded-xl bg-[#0B1215] text-white p-5 border border-slate-800 mb-6">
      <div className="flex items-center justify-between gap-4 mb-3">
        <span className="text-xs font-mono text-[#60A5FA] tabular-nums">
          Interactive Journey · Stage {steps[activeStep]?.step} of 0{steps.length}
        </span>
        <span className="text-xs font-mono text-slate-400">
          Click any node to inspect deliverable
        </span>
      </div>

      <svg
        viewBox="0 0 640 110"
        className="w-full h-auto block"
        role="img"
        aria-label="Interactive 7-stage delivery timeline"
      >
        <line x1="42" y1="46" x2="598" y2="46" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
        <motion.line
          x1="42"
          y1="46"
          x2="598"
          y2="46"
          stroke="#1D4ED8"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0.14 }}
          animate={{ pathLength: progressRatio }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        />

        {steps.map((s, idx) => {
          const x = 42 + idx * ((598 - 42) / (steps.length - 1));
          const selected = idx === activeStep;
          const completed = idx <= activeStep;

          return (
            <g
              key={s.step}
              onClick={() => onSelectStep(idx)}
              className="cursor-pointer focus:outline-none"
              role="button"
              tabIndex={0}
              aria-label={`Stage ${s.step}: ${s.title}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectStep(idx);
                }
              }}
            >
              {selected && (
                <motion.circle
                  cx={x}
                  cy="46"
                  r="19"
                  fill="none"
                  stroke="#60A5FA"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                />
              )}
              <circle
                cx={x}
                cy="46"
                r="13"
                fill={selected ? '#1D4ED8' : completed ? '#111F2E' : '#0B1215'}
                stroke={completed ? '#60A5FA' : '#334155'}
                strokeWidth="1.6"
              />
              <text
                x={x}
                y="50"
                textAnchor="middle"
                fill={completed ? '#FFFFFF' : '#64748B'}
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="600"
              >
                {s.step}
              </text>
              <text
                x={x}
                y="84"
                textAnchor="middle"
                fill={selected ? '#FFFFFF' : '#94A3B8'}
                fontSize="9"
                fontFamily="Manrope, sans-serif"
                fontWeight={selected ? '600' : '400'}
              >
                {s.title.split(' ')[0]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Six bespoke animated SVG schematics tailored to each GROVIADS portfolio blueprint.
 */
export function BlueprintAnimatedSchematic({
  blueprintId,
  tone,
  index,
}: {
  blueprintId: string;
  tone: PortfolioBlueprint['accentTone'];
  index: number;
}) {
  const bg = tone === 'navy' ? '#0B1215' : tone === 'cobalt' ? '#101A23' : '#131D27';
  const accent = '#60A5FA';
  const primary = '#1D4ED8';
  const variant = index % 6;

  return (
    <div
      className="w-full h-48 rounded-lg overflow-hidden border border-slate-800/80 mb-5 flex items-center justify-center p-4 relative group"
      style={{ backgroundColor: bg }}
    >
      <svg
        viewBox="0 0 360 150"
        className="w-full h-full"
        role="img"
        aria-label={`Animated system graphic for ${blueprintId}`}
      >
        {/* Framing Grid */}
        <rect x="10" y="10" width="340" height="130" rx="6" fill="none" stroke="#1E293B" />
        <line x1="10" y1="34" x2="350" y2="34" stroke="#1E293B" />
        <rect x="22" y="18" width="48" height="8" rx="2" fill={accent} />
        <rect x="78" y="18" width="70" height="8" rx="2" fill="#334155" />
        <rect x="294" y="18" width="44" height="8" rx="2" fill="#1E293B" />

        {variant === 0 && (
          /* SaaS Multi-Channel Search + GEO Attribution Graph */
          <>
            <path
              d="M 28 118 C 86 114, 128 84, 186 72 C 238 62, 282 48, 332 42"
              fill="none"
              stroke="#1E293B"
              strokeWidth="2"
            />
            <motion.path
              d="M 28 118 C 86 114, 128 84, 186 72 C 238 62, 282 48, 332 42"
              fill="none"
              stroke={accent}
              strokeWidth="2.5"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            />
            <path
              d="M 28 124 L 116 112 L 204 102 L 332 82"
              fill="none"
              stroke="#475569"
              strokeWidth="1.5"
              className="animate-signal-flow-slow"
            />
            <circle cx="116" cy="96" r="4" fill={primary} stroke="#fff" strokeWidth="1.2" />
            <circle cx="204" cy="70" r="4" fill={accent} stroke="#fff" strokeWidth="1.2" />
            <circle cx="332" cy="42" r="5" fill="#fff" stroke={primary} strokeWidth="2" />
            <rect x="24" y="46" width="110" height="32" rx="4" fill="#111F2E" stroke="#263544" />
            <text x="34" y="60" fill={accent} fontSize="8.5" fontFamily="JetBrains Mono, monospace">
              SEO + AI GEO
            </text>
            <text x="34" y="72" fill="#E2E8F0" fontSize="9.5" fontWeight="600">
              Intent Capture
            </text>
          </>
        )}

        {variant === 1 && (
          /* Web, App & Cloud Mesh Architecture */
          <>
            <path
              d="M 86 86 L 166 86 M 214 66 L 266 56 M 214 104 L 266 114"
              fill="none"
              stroke={accent}
              strokeWidth="1.8"
              className="animate-signal-flow"
            />
            <rect x="24" y="64" width="66" height="44" rx="5" fill="#111F2E" stroke="#2D4363" />
            <text x="57" y="84" textAnchor="middle" fill="#fff" fontSize="9.5" fontWeight="600">
              Web/App
            </text>
            <text x="57" y="98" textAnchor="middle" fill="#94A3B8" fontSize="8">
              React Edge
            </text>

            <rect x="148" y="60" width="70" height="52" rx="6" fill={primary} />
            <text x="183" y="84" textAnchor="middle" fill="#fff" fontSize="9.5" fontWeight="700">
              API Mesh
            </text>
            <text x="183" y="98" textAnchor="middle" fill="#DBEAFE" fontSize="8">
              Auth + Sync
            </text>

            <rect x="262" y="42" width="76" height="34" rx="4" fill="#111F2E" stroke={accent} />
            <text x="300" y="62" textAnchor="middle" fill="#E2E8F0" fontSize="9">
              Relational DB
            </text>

            <rect x="262" y="94" width="76" height="34" rx="4" fill="#111F2E" stroke="#2D4363" />
            <text x="300" y="114" textAnchor="middle" fill="#94A3B8" fontSize="9">
              Realtime Cache
            </text>
          </>
        )}

        {variant === 2 && (
          /* Enterprise ERP & Ledger Automation */
          <>
            {[0, 1, 2].map((col) => (
              <motion.rect
                key={col}
                x={26 + col * 108}
                y="50"
                width="92"
                height="74"
                rx="5"
                fill="#111F2E"
                stroke={col === 1 ? accent : '#263544'}
                initial={{ opacity: 0.4, y: 56 }}
                whileInView={{ opacity: 1, y: 50 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: col * 0.08 }}
              />
            ))}
            <path d="M 118 87 L 134 87 M 226 87 L 242 87" stroke={accent} strokeWidth="2" />
            <text x="72" y="72" textAnchor="middle" fill="#94A3B8" fontSize="8.5">
              INGESTION
            </text>
            <text x="72" y="94" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="600">
              Field Ops
            </text>
            <text x="180" y="72" textAnchor="middle" fill={accent} fontSize="8.5">
              WORKFLOW
            </text>
            <text x="180" y="94" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="600">
              ERP Rules
            </text>
            <text x="288" y="72" textAnchor="middle" fill="#94A3B8" fontSize="8.5">
              OUTPUT
            </text>
            <text x="288" y="94" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="600">
              Audit Log
            </text>
          </>
        )}

        {variant === 3 && (
          /* Executive BI Telemetry Matrix */
          <>
            {[36, 58, 44, 72, 64, 84].map((h, i) => (
              <motion.rect
                key={i}
                x={34 + i * 36}
                y={124 - h}
                width="20"
                height={h}
                rx="3"
                fill={i >= 4 ? accent : '#263544'}
                style={{ transformOrigin: `${44 + i * 36}px 124px` }}
                initial={{ scaleY: 0.25, opacity: 0.5 }}
                whileInView={{ scaleY: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
              />
            ))}
            <rect x="260" y="50" width="78" height="72" rx="5" fill="#111F2E" stroke={accent} />
            <text x="299" y="74" textAnchor="middle" fill={accent} fontSize="11" fontWeight="700">
              BI Cube
            </text>
            <text x="299" y="92" textAnchor="middle" fill="#CBD5E1" fontSize="8.5">
              KPI Alerts
            </text>
            <text x="299" y="106" textAnchor="middle" fill="#64748B" fontSize="8">
              Cohort Sync
            </text>
          </>
        )}

        {variant === 4 && (
          /* AI & Workflow Automation Orchestrator */
          <>
            <path
              d="M 88 87 C 125 87, 130 62, 166 62 M 88 87 C 125 87, 130 112, 166 112 M 234 62 L 274 87 M 234 112 L 274 87"
              fill="none"
              stroke={accent}
              strokeWidth="1.8"
              className="animate-signal-flow"
            />
            <rect x="24" y="68" width="66" height="38" rx="5" fill="#111F2E" stroke="#2D4363" />
            <text x="57" y="91" textAnchor="middle" fill="#fff" fontSize="9.5" fontWeight="600">
              Lead Event
            </text>

            <rect x="164" y="44" width="72" height="34" rx="5" fill={primary} />
            <text x="200" y="65" textAnchor="middle" fill="#fff" fontSize="9.5" fontWeight="600">
              AI Router
            </text>

            <rect x="164" y="94" width="72" height="34" rx="5" fill="#111F2E" stroke="#2D4363" />
            <text x="200" y="115" textAnchor="middle" fill="#E2E8F0" fontSize="9">
              CRM Enrich
            </text>

            <rect x="272" y="66" width="66" height="42" rx="5" fill="#111F2E" stroke={accent} />
            <text x="305" y="90" textAnchor="middle" fill={accent} fontSize="9.5" fontWeight="600">
              Auto Book
            </text>
          </>
        )}

        {variant === 5 && (
          /* E-Commerce Conversion Funnel Schematic */
          <>
            <polygon points="34,54 134,54 118,122 50,122" fill="#111F2E" stroke="#2D4363" />
            <line x1="39" y1="76" x2="129" y2="76" stroke={accent} strokeWidth="1.5" />
            <line x1="44" y1="98" x2="124" y2="98" stroke={primary} strokeWidth="1.5" />
            <text x="84" y="68" textAnchor="middle" fill="#E2E8F0" fontSize="8.5">
              Storefront Speed
            </text>
            <text x="84" y="90" textAnchor="middle" fill={accent} fontSize="8.5">
              Checkout Flow
            </text>
            <text x="84" y="113" textAnchor="middle" fill="#94A3B8" fontSize="8.5">
              Retention
            </text>

            <path
              d="M 142 88 L 194 88"
              fill="none"
              stroke={accent}
              strokeWidth="2"
              className="animate-signal-flow"
            />

            <rect x="198" y="54" width="136" height="68" rx="6" fill="#111F2E" stroke={accent} />
            <text x="266" y="78" textAnchor="middle" fill="#fff" fontSize="10.5" fontWeight="600">
              Conversion Lift
            </text>
            <text x="266" y="96" textAnchor="middle" fill={accent} fontSize="9.5" fontFamily="JetBrains Mono, monospace">
              Checkout + CRM Sync
            </text>
            <text x="266" y="111" textAnchor="middle" fill="#94A3B8" fontSize="8">
              Multi-region catalog
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
