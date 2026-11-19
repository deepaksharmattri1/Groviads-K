export type PillarKey = 'growth' | 'technology' | 'intelligence';

export interface ServiceCategory {
  id: string;
  index: string;
  title: string;
  pillar: PillarKey;
  pillarLabel: string;
  summary: string;
  deliverables: string[];
}

export interface PortfolioBlueprint {
  id: string;
  title: string;
  clientType: string;
  industry: string;
  pillar: PillarKey;
  pillarLabel: string;
  timeline: string;
  challenge: string;
  solution: string;
  deliverables: string[];
  outcomeMetric: string;
  architectureStack: string[];
  accentTone: 'navy' | 'amber' | 'cobalt';
}

export interface ServicePackage {
  id: string;
  name: string;
  audience: string;
  cadence: 'Free' | 'One-Time' | 'Monthly Retainer' | 'Milestone';
  serviceFeeUsd: number;
  adSpendNote: string;
  summary: string;
  deliverables: string[];
  highlighted?: boolean;
}

export const COMPANY_INFO = {
  name: 'GROVIADS',
  positioning: 'Business Growth & Technology Solutions Company',
  category: 'Digital services, software and business consulting',
  model: 'B2B services, projects, retainers and consulting',
  tagline: 'Your Ideas. Our Expertise. Bigger Growth.',
  website: 'groviads.com',
  email: 'contact@groviads.com',
  ownerNotificationEmail: 'contact@groviads.com',
  market: 'Worldwide',
  followUpSla: 'Within 24 hours',
  vision:
    'To become a trusted global business growth partner that helps organizations of all sizes grow through technology, innovation, strategy and digital solutions.',
  mission:
    'To make professional growth solutions accessible by understanding business challenges and delivering practical services that strengthen visibility, create opportunities, improve operations and support long-term development.',
  philosophy: [
    'Understand the business problem before recommending a service.',
    'Develop a solution suited to the client’s goals, resources and market.',
    'Plan and implement the agreed work professionally.',
    'Measure progress using relevant outcomes and performance indicators.',
    'Improve continuously through reporting, feedback and ongoing support.',
  ],
};

export const PILLARS: { key: PillarKey; title: string; focus: string }[] = [
  {
    key: 'growth',
    title: 'Growth Services',
    focus: 'Marketing, branding, lead generation and strategic consulting',
  },
  {
    key: 'technology',
    title: 'Technology Solutions',
    focus: 'Websites, applications, custom software, SaaS and AI automation',
  },
  {
    key: 'intelligence',
    title: 'Business Intelligence',
    focus: 'Research, analysis, reporting, project management and optimization',
  },
];

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'digital-marketing',
    index: '01',
    title: 'Digital Marketing & Search Optimization',
    pillar: 'growth',
    pillarLabel: 'Growth Services',
    summary:
      'Strengthen organic visibility across traditional search engines, local maps, and modern AI answer engines.',
    deliverables: [
      'Search Engine Optimization (SEO) & Local SEO',
      'Answer Engine (AEO), Generative Engine (GEO) & AI Optimization (AIO)',
      'Search Experience Optimization (SXO) & Google Business Profile',
      'Social Media Marketing (SMM/SMO), Content & Email Marketing',
      'Brand awareness & online reputation management',
    ],
  },
  {
    id: 'web-app-tech',
    index: '02',
    title: 'Website, Application & Technology Solutions',
    pillar: 'technology',
    pillarLabel: 'Technology Solutions',
    summary:
      'Conversion-oriented corporate websites, e-commerce storefronts, and responsive web or mobile applications.',
    deliverables: [
      'Business & corporate website development',
      'E-commerce website development & high-converting landing pages',
      'Web application & mobile application development',
      'UI/UX design & website redesigns',
      'Website management, maintenance & technical support',
    ],
  },
  {
    id: 'software-engineering',
    index: '03',
    title: 'Software Development & Engineering',
    pillar: 'technology',
    pillarLabel: 'Technology Solutions',
    summary:
      'Custom software, SaaS platforms, CRM/ERP systems, and reliable API integrations engineered for longevity.',
    deliverables: [
      'Custom software, SaaS & enterprise platform development',
      'CRM, ERP, school & business management systems',
      'API development, database architecture & third-party integrations',
      'AI-powered software solutions & cloud deployments',
      'Software testing, quality assurance & modernization',
    ],
  },
  {
    id: 'performance-marketing',
    index: '04',
    title: 'Performance Marketing & Lead Generation',
    pillar: 'growth',
    pillarLabel: 'Growth Services',
    summary:
      'Structured customer acquisition across paid search, social channels, and optimized sales funnels.',
    deliverables: [
      'Google Ads, Meta Ads, LinkedIn & YouTube campaign management',
      'B2B and B2C lead generation & approved outreach campaigns',
      'Sales funnel development & Conversion Rate Optimization (CRO)',
      'Customer acquisition strategy & transparent campaign reporting',
    ],
  },
  {
    id: 'business-intelligence',
    index: '05',
    title: 'Business Analysis & Intelligence',
    pillar: 'intelligence',
    pillarLabel: 'Business Intelligence',
    summary:
      'Evidence-based market research, customer behaviour mapping, and operational reporting dashboards.',
    deliverables: [
      'Business performance analysis & growth opportunity identification',
      'Market, competitor & customer behaviour research',
      'Business reporting, dashboard planning & KPI tracking',
      'Business process analysis and operational improvement',
    ],
  },
  {
    id: 'creative-design',
    index: '06',
    title: 'Graphic Design & Creative Solutions',
    pillar: 'growth',
    pillarLabel: 'Growth Services',
    summary:
      'Cohesive visual systems, brand identities, pitch collateral, and motion assets built for commercial clarity.',
    deliverables: [
      'Logo design & complete brand identity systems',
      'Social media creatives & performance advertising banners',
      'Brochures, sales decks & executive presentation design',
      'Video editing, reels, motion graphics & promotional visuals',
    ],
  },
  {
    id: 'consulting-pm',
    index: '07',
    title: 'Project Management & Business Consulting',
    pillar: 'intelligence',
    pillarLabel: 'Business Intelligence',
    summary:
      'From idea validation and go-to-market planning to structured delivery governance and digital transformation.',
    deliverables: [
      'Startup consultation, idea validation & go-to-market planning',
      'Business planning, expansion strategy & digital transformation',
      'Project planning, coordination, monitoring & execution support',
      'Process and delivery management across distributed teams',
    ],
  },
  {
    id: 'ai-automation',
    index: '08',
    title: 'AI & Business Automation',
    pillar: 'technology',
    pillarLabel: 'Technology Solutions',
    summary:
      'Practical workflow automation across WhatsApp, CRM pipelines, and AI-assisted customer interactions.',
    deliverables: [
      'AI chatbot planning, integration & sales funnel support',
      'WhatsApp & customer communication automation',
      'CRM, email & internal operational workflow automation',
      'AI-assisted content workflows & business automation consulting',
    ],
  },
  {
    id: 'ecommerce-growth',
    index: '09',
    title: 'E-commerce Growth Solutions',
    pillar: 'growth',
    pillarLabel: 'Growth Services',
    summary:
      'End-to-end storefront engineering, product discoverability, shopping ads, and checkout conversion lifts.',
    deliverables: [
      'Shopify & WooCommerce storefront development',
      'E-commerce SEO, product marketing & Google Shopping Ads',
      'Shopping cart recovery strategies & checkout CRO',
    ],
  },
];

export const PORTFOLIO_BLUEPRINTS: PortfolioBlueprint[] = [
  {
    id: 'b2b-saas-engine',
    title: 'Multi-Tenant Operations & CRM Platform',
    clientType: 'Growth-Stage B2B Organization',
    industry: 'IT and Software',
    pillar: 'technology',
    pillarLabel: 'Technology Solutions',
    timeline: '12-Week Delivery',
    challenge:
      'Fragmented spreadsheets and manual client onboarding slowed sales follow-up and obscured recurring revenue visibility.',
    solution:
      'Engineered a unified web portal with role-based permissions, automated pipeline alerts, REST API webhooks, and scheduled reporting.',
    deliverables: [
      'Custom SaaS Portal & Relational Database Schema',
      'Automated Email & Calendar Booking Sync',
      'Executive Activity & Retention Reporting Console',
    ],
    outcomeMetric: 'Unified 4 disconnected tools into 1 automated operational workflow',
    architectureStack: ['TypeScript', 'React', 'Node.js API', 'PostgreSQL / SQLite'],
    accentTone: 'navy',
  },
  {
    id: 'omnichannel-acquisition',
    title: 'Search, GEO & Paid Acquisition Funnel',
    clientType: 'Regional Healthcare Network',
    industry: 'Healthcare',
    pillar: 'growth',
    pillarLabel: 'Growth Services',
    timeline: '6-Month Retainer',
    challenge:
      'Low visibility in local search and AI answer engines caused high reliance on expensive generic ad placements.',
    solution:
      'Restructured service landing pages for SXO/GEO discoverability, calibrated Google & Meta lead campaigns, and embedded instant consultation booking.',
    deliverables: [
      'Local SEO, AEO & Generative Engine Optimization',
      'High-Intent Google Ads & Meta Lead Funnel',
      '24-Hour Automated Enquiry Triage & Booking Flow',
    ],
    outcomeMetric: 'Structured cost-per-enquiry attribution & 100% tracked booking funnel',
    architectureStack: ['SEO / GEO', 'Google Ads', 'CRO Landing System', 'CRM Sync'],
    accentTone: 'amber',
  },
  {
    id: 'ai-whatsapp-concierge',
    title: 'WhatsApp & CRM Lead Qualification Automation',
    clientType: 'Multi-Location Real Estate Group',
    industry: 'Real Estate',
    pillar: 'technology',
    pillarLabel: 'Technology Solutions',
    timeline: '6-Week Sprint',
    challenge:
      'International property enquiries arrived across time zones outside office hours, leaving qualified prospects waiting days for a callback.',
    solution:
      'Deployed an automated WhatsApp and web-chat triage assistant connected directly to calendar availability and CRM notifications.',
    deliverables: [
      '24/7 Conversational Intake & Qualification Flow',
      'Automated Time-Zone Aware Consultation Scheduling',
      'Instant Advisor Email & Dashboard Alerts',
    ],
    outcomeMetric: 'Reduced initial prospect response wait from 38 hours to < 60 seconds',
    architectureStack: ['AI Workflows', 'WhatsApp API', 'Automated Scheduling', 'Webhooks'],
    accentTone: 'cobalt',
  },
  {
    id: 'commerce-conversion-system',
    title: 'Headless Storefront & Cart Recovery Architecture',
    clientType: 'Direct-to-Consumer Retail Brand',
    industry: 'E-commerce and Retail',
    pillar: 'growth',
    pillarLabel: 'Growth Services',
    timeline: '8-Week Engagement',
    challenge:
      'Slow mobile checkout pages and unsegmented product feeds limited return on Google Shopping ad spend.',
    solution:
      'Rebuilt the storefront UI/UX for mobile speed, added structured product schema for e-commerce SEO, and launched automated cart recovery sequences.',
    deliverables: [
      'Mobile-First Storefront Redesign & Checkout Optimization',
      'Google Shopping Feed & Product SEO Architecture',
      'Automated Email & WhatsApp Cart Recovery Workflows',
    ],
    outcomeMetric: 'Streamlined checkout from 5 steps to 2 with transparent ad-spend tracking',
    architectureStack: ['Shopify / WooCommerce', 'Shopping Ads', 'E-commerce SEO', 'CRO'],
    accentTone: 'amber',
  },
  {
    id: 'executive-bi-suite',
    title: 'Cross-Channel Performance & Margin Intelligence Hub',
    clientType: 'Industrial Manufacturing Group',
    industry: 'Manufacturing',
    pillar: 'intelligence',
    pillarLabel: 'Business Intelligence',
    timeline: '10-Week Program',
    challenge:
      'Leadership lacked a single source of truth linking marketing spend, distributor enquiries, and project delivery timelines.',
    solution:
      'Conducted business process analysis, standardized KPI definitions, and delivered an interactive executive reporting dashboard.',
    deliverables: [
      'Competitor & Market Opportunity Assessment',
      'Standardized KPI & Unit-Economics Model',
      'Live Enquiry-to-Revenue Attribution Dashboard',
    ],
    outcomeMetric: 'Weekly executive reporting time reduced from 12 hours manual prep to real-time',
    architectureStack: ['Business Analysis', 'KPI Governance', 'Attribution Models', 'SQL Views'],
    accentTone: 'navy',
  },
  {
    id: 'edtech-management-portal',
    title: 'Institutional Portal & Brand Identity System',
    clientType: 'Private Education Provider',
    industry: 'Education',
    pillar: 'intelligence',
    pillarLabel: 'Business Intelligence',
    timeline: '10-Week Delivery',
    challenge:
      'Outdated web presence and manual student admissions paperwork created friction for international applicants.',
    solution:
      'Delivered a refreshed brand identity, admissions portal, automated interview scheduling, and encrypted applicant communications.',
    deliverables: [
      'Brand Identity, Guidelines & Presentation Collateral',
      'Admissions Web Application & Document Workflow',
      'Go-to-Market Launch & Project Governance Plan',
    ],
    outcomeMetric: 'End-to-end digital admissions workflow with 24-hour advisor follow-up SLA',
    architectureStack: ['Brand Systems', 'Web App', 'Scheduling Engine', 'E2EE Comms'],
    accentTone: 'cobalt',
  },
];

export const DELIVERY_PROCESS = [
  {
    step: '01',
    title: 'Discover',
    detail: 'A prospect finds GROVIADS through our website, search, referral, or outreach.',
  },
  {
    step: '02',
    title: 'Free Initial Consultation',
    detail: 'A complimentary strategy session to understand your business, objectives, and challenges.',
  },
  {
    step: '03',
    title: 'Business Assessment',
    detail: 'Identify core needs, operational constraints, technical options, and top priorities.',
  },
  {
    step: '04',
    title: 'Customized Proposal',
    detail: 'Written scope setting out deliverables, timeline, governance, and responsibilities.',
  },
  {
    step: '05',
    title: 'Approval & Onboarding',
    detail: 'Confirm agreement, onboarding checklist, access requirements, and points of contact.',
  },
  {
    step: '06',
    title: 'Execution',
    detail: 'Deliver agreed marketing, software, or automation work with proactive progress updates.',
  },
  {
    step: '07',
    title: 'Reporting & Support',
    detail: 'Review agreed performance indicators, share clear reports, and plan next growth steps.',
  },
];

export const TARGET_GROUPS = [
  {
    name: 'Startups',
    focus: 'Business planning, branding, websites, MVP software and go-to-market support.',
  },
  {
    name: 'Small Businesses',
    focus: 'Online visibility, customer acquisition, conversion websites and process improvement.',
  },
  {
    name: 'E-commerce Brands',
    focus: 'Online store engineering, shopping ads, product SEO and checkout optimization.',
  },
  {
    name: 'Established Organizations',
    focus: 'Digital transformation, custom CRM/ERP software, AI automation and project support.',
  },
  {
    name: 'Local Businesses',
    focus: 'Local SEO, Google Business Profile management and steady inbound enquiry generation.',
  },
  {
    name: 'Service Providers & Professionals',
    focus: 'Lead generation funnels, automated appointment scheduling and brand authority.',
  },
  {
    name: 'Entrepreneurs',
    focus: 'Idea validation, structured roadmaps and practical technology consulting.',
  },
];

export const INDUSTRIES = [
  'Education',
  'Healthcare',
  'Real Estate',
  'Finance & Professional Services',
  'E-commerce & Retail',
  'Hospitality',
  'IT & Software',
  'Manufacturing',
];

export const SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: 'free-consultation',
    name: 'Initial Discovery Consultation',
    audience: 'For every new & returning prospect',
    cadence: 'Free',
    serviceFeeUsd: 0,
    adSpendNote: 'No payment required — complimentary 30-minute business & technology review.',
    summary:
      'Discuss your goals, bottlenecks, and market context before any scope or budget is proposed.',
    deliverables: [
      '30-minute 1-on-1 video or phone strategy call',
      'Preliminary digital presence & workflow assessment',
      'Written next-step recommendations within 24 hours',
    ],
  },
  {
    id: 'growth-audit-sprint',
    name: 'Growth Strategy & Technical Audit',
    audience: 'For startups & local businesses',
    cadence: 'One-Time',
    serviceFeeUsd: 490,
    adSpendNote: 'GROVIADS consulting fee only. Any future ad spend is billed directly to your ad accounts.',
    summary:
      'Deep-dive audit across SEO/GEO, conversion bottlenecks, software architecture, and automation opportunities.',
    deliverables: [
      'Full search, AEO/GEO & website conversion audit',
      'Competitor & customer acquisition benchmark report',
      'Prioritized 90-day implementation & budget roadmap',
    ],
  },
  {
    id: 'monthly-growth-retainer',
    name: 'Integrated Growth Retainer',
    audience: 'For scaling businesses & e-commerce',
    cadence: 'Monthly Retainer',
    serviceFeeUsd: 1800,
    adSpendNote: 'Service management fee only. Third-party ad spend & SaaS licenses remain strictly separate.',
    summary:
      'Ongoing execution combining SEO/GEO, performance campaign management, CRO, and continuous reporting.',
    deliverables: [
      'Continuous SEO, AEO/GEO & landing page optimization',
      'Google / Meta / LinkedIn campaign execution & testing',
      'Monthly KPI performance report & executive review call',
    ],
    highlighted: true,
  },
  {
    id: 'software-automation-milestone',
    name: 'Software & Automation Milestone',
    audience: 'For established & product-led teams',
    cadence: 'Milestone',
    serviceFeeUsd: 3500,
    adSpendNote: 'Fixed milestone deposit toward agreed written software & automation scope.',
    summary:
      'Architecture, development, QA testing, and deployment of custom web apps, CRM/ERP tools, or AI workflows.',
    deliverables: [
      'Written technical specification & database architecture',
      'Full-stack engineering, API integrations & QA testing',
      'Cloud deployment, documentation & handover support',
    ],
  },
];

export const COUNTRIES = [
  'United States',
  'United Kingdom',
  'India',
  'United Arab Emirates',
  'Canada',
  'Australia',
  'Germany',
  'Singapore',
  'Netherlands',
  'Other Worldwide',
];

export const TIMEZONES = [
  'UTC (GMT+0)',
  'America/New_York (EST)',
  'America/Los_Angeles (PST)',
  'Europe/London (GMT)',
  'Europe/Berlin (CET)',
  'Asia/Dubai (GST)',
  'Asia/Kolkata (IST)',
  'Asia/Singapore (SGT)',
  'Australia/Sydney (AEST)',
];

export const DAILY_TIME_SLOTS = [
  '09:00',
  '10:00',
  '11:30',
  '14:00',
  '15:30',
  '17:00',
  '19:00',
];
