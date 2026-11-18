import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import type { AppRoute } from '../utils/routing';

interface NavbarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onBookFreeCall: () => void;
}

const NAV_LINKS: { route: AppRoute; label: string }[] = [
  { route: '/services', label: 'Services' },
  { route: '/portfolio', label: 'Portfolio' },
  { route: '/consultation', label: 'Consultation' },
  { route: '/contact', label: 'Contact' },
  { route: '/dashboard', label: 'Dashboard' },
];

export function Navbar({ currentRoute, onNavigate, onBookFreeCall }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleRouteClick = (route: AppRoute) => {
    setMobileMenuOpen(false);
    onNavigate(route);
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1280px] mx-auto h-full px-4 sm:px-8 flex items-center justify-between gap-8">
        {/* Zone 1: Single clean text element wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            handleRouteClick('/');
          }}
          className="font-display text-xl font-bold tracking-tight text-[#0B1215] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1D4ED8]"
        >
          GROVIADS
        </a>

        {/* Zone 2: 5 concise single-line multi-page navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          {NAV_LINKS.map((item) => {
            const active = currentRoute === item.route;
            return (
              <a
                key={item.route}
                href={item.route}
                aria-current={active ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  handleRouteClick(item.route);
                }}
                className={`transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'text-[#0B1215] font-semibold underline underline-offset-8 decoration-[#1D4ED8] decoration-2'
                    : 'hover:text-[#0B1215] hover:underline underline-offset-8 decoration-slate-300 decoration-2'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onBookFreeCall();
            }}
            className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B1215]"
          >
            Book Free Call
          </button>
          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-1.5 shadow-lg">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleRouteClick('/');
            }}
            className={`block py-2.5 px-3 rounded-lg text-sm font-medium ${
              currentRoute === '/'
                ? 'bg-slate-100 text-[#0B1215] font-semibold'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Home
          </a>
          {NAV_LINKS.map((item) => {
            const active = currentRoute === item.route;
            return (
              <a
                key={item.route}
                href={item.route}
                onClick={(e) => {
                  e.preventDefault();
                  handleRouteClick(item.route);
                }}
                className={`block py-2.5 px-3 rounded-lg text-sm font-medium ${
                  active
                    ? 'bg-slate-100 text-[#0B1215] font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </a>
            );
          })}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onBookFreeCall();
            }}
            className="w-full mt-2 py-3 px-4 rounded-lg text-sm font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] transition-colors cursor-pointer"
          >
            Book Free Consultation
          </button>
        </div>
      )}
    </header>
  );
}
