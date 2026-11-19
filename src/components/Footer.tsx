import { COMPANY_INFO } from '../data/groviadsProfile';
import type { AppRoute } from '../utils/routing';

interface FooterProps {
  onNavigate: (route: AppRoute) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-[#0B1215] text-slate-300 border-t border-slate-800">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-white/10">
          <div className="md:col-span-5">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/');
              }}
              className="font-display text-xl font-bold text-white tracking-tight mb-2 inline-block"
            >
              {COMPANY_INFO.name}
            </a>
            <p className="text-sm text-[#60A5FA] font-medium mb-3">{COMPANY_INFO.tagline}</p>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              {COMPANY_INFO.positioning}. Serving startups, growing businesses, and established
              organizations worldwide.
            </p>
          </div>

          <div className="md:col-span-3 space-y-2.5 text-xs">
            <p className="font-semibold text-white mb-3">Pages</p>
            {[
              { route: '/' as AppRoute, label: 'Home Overview' },
              { route: '/services' as AppRoute, label: 'Services & Process' },
              { route: '/portfolio' as AppRoute, label: 'Solution Blueprints' },
              { route: '/ai-hub' as AppRoute, label: 'AI Advisory Hub' },
              { route: '/consultation' as AppRoute, label: 'Free Consultation' },
              { route: '/contact' as AppRoute, label: 'Contact & Project Enquiry' },
              { route: '/dashboard' as AppRoute, label: 'Executive & Client Console' },
            ].map((item) => (
              <a
                key={item.route}
                href={item.route}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(item.route);
                }}
                className="block text-slate-300 hover:text-white transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="md:col-span-4 space-y-2 text-xs">
            <p className="font-semibold text-white mb-3">Direct Contact</p>
            <p>
              Website: <span className="text-white font-medium">{COMPANY_INFO.website}</span>
            </p>
            <p>
              Advisory Email:{' '}
              <a
                href={`mailto:${COMPANY_INFO.email}`}
                className="text-white hover:text-[#60A5FA] underline underline-offset-2"
              >
                {COMPANY_INFO.email}
              </a>
            </p>
            <p>Market Coverage: {COMPANY_INFO.market}</p>
            <p>Follow-Up Target: {COMPANY_INFO.followUpSla}</p>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} GROVIADS. All rights reserved.</p>
          <p>
            All service scopes, timelines, and deliverables are confirmed in writing prior to
            project commencement.
          </p>
        </div>
      </div>
    </footer>
  );
}
