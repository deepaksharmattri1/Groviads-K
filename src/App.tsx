import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { AiAdvisoryHub } from './components/AiAdvisoryHub';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { LiveChatWidget } from './components/LiveChatWidget';
import { Navbar } from './components/Navbar';
import { PortfolioSection } from './components/PortfolioSection';
import { ServicesAndProcessSection } from './components/ServicesAndProcessSection';
import type { PillarKey } from './data/groviadsProfile';
import type { VisitorProfile } from './types';
import { getPageMeta, parseAppRoute, type AppRoute } from './utils/routing';

const CLIENT_ID_STORAGE_KEY = 'groviads_visitor_client_id_v1';

function getOrCreateClientId(): string {
  try {
    const existing = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
    if (existing) return existing;
    const generated = `cli_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, generated);
    return generated;
  } catch {
    return `cli_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export default function App() {
  const [clientId] = useState<string>(() => getOrCreateClientId());
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    if (typeof window === 'undefined') return '/';
    return parseAppRoute(window.location.pathname, window.location.hash);
  });
  const [servicesPillar, setServicesPillar] = useState<PillarKey | 'all'>('all');
  const [selectedScopeServices, setSelectedScopeServices] = useState<string[]>([]);
  const [preselectedService, setPreselectedService] = useState<string | null>(null);
  const [advisorPublicKey, setAdvisorPublicKey] = useState<JsonWebKey | null>(null);
  const [advisorFingerprint, setAdvisorFingerprint] = useState<string | null>(null);
  const [mapsApiKey, setMapsApiKey] = useState<string>('');
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);
  const [visitor, setVisitor] = useState<VisitorProfile | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const trackEvent = (eventType: string, section: string, label: string) => {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, eventType, section, label }),
    }).catch(() => {});
  };

  useEffect(() => {
    const onQuotaExceeded = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  useEffect(() => {
    fetch(`/api/bootstrap?clientId=${encodeURIComponent(clientId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.advisorPublicKey) setAdvisorPublicKey(data.advisorPublicKey);
        if (data.advisorFingerprint) setAdvisorFingerprint(data.advisorFingerprint);
        if (data.mapsApiKey) setMapsApiKey(data.mapsApiKey);
        if (data.visitor) setVisitor(data.visitor);
      })
      .catch(() => {});

    trackEvent('page_view', getPageMeta(currentRoute).section, `Loaded ${currentRoute}`);
  }, [clientId]);

  useEffect(() => {
    const meta = getPageMeta(currentRoute);
    document.title = meta.title;
  }, [currentRoute]);

  useEffect(() => {
    const handlePopState = () => {
      const next = parseAppRoute(window.location.pathname, window.location.hash);
      setCurrentRoute(next);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (
    route: AppRoute,
    options?: { pillar?: PillarKey | 'all'; serviceTitle?: string }
  ) => {
    if (options?.pillar) {
      setServicesPillar(options.pillar);
    } else if (route === '/services' && !options) {
      setServicesPillar('all');
    }
    if (options?.serviceTitle) {
      setPreselectedService(options.serviceTitle);
    }
    if (window.location.pathname !== route) {
      window.history.pushState({}, '', route);
    }
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    trackEvent('navigation', getPageMeta(route).section, `Navigated to ${route}`);
  };

  const handleOpenEnquiry = (serviceTitle?: string) => {
    if (serviceTitle) {
      setPreselectedService(serviceTitle);
    }
    trackEvent('cta_click', 'contact', serviceTitle || 'Send Project Enquiry');
    navigate('/contact', { serviceTitle });
  };

  const handleToggleScopeService = (serviceTitle: string) => {
    setSelectedScopeServices((prev) =>
      prev.includes(serviceTitle)
        ? prev.filter((item) => item !== serviceTitle)
        : [...prev, serviceTitle]
    );
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
        {mapsQuotaExceeded && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              >
                maps developer site
              </a>{' '}
              for instructions to update your account.
            </span>
          </div>
        )}

        <Navbar
          currentRoute={currentRoute}
          onNavigate={(route) => navigate(route)}
          onOpenEnquiry={() => handleOpenEnquiry()}
        />

        <main className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentRoute}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1"
            >
              {currentRoute === '/' && (
                <HeroSection
                  visitor={visitor}
                  onNavigate={navigate}
                  onOpenEnquiry={handleOpenEnquiry}
                />
              )}

              {currentRoute === '/services' && (
                <ServicesAndProcessSection
                  initialPillar={servicesPillar}
                  selectedScopeServices={selectedScopeServices}
                  onToggleScopeService={handleToggleScopeService}
                  onSelectServiceForBooking={(title) => handleOpenEnquiry(title)}
                  onBookWithScope={() => handleOpenEnquiry()}
                  onEnquireWithScope={() => handleOpenEnquiry()}
                />
              )}

              {currentRoute === '/portfolio' && (
                <PortfolioSection
                  onBookForBlueprint={(title) => handleOpenEnquiry(title)}
                  onTrackEvent={trackEvent}
                />
              )}

              {currentRoute === '/ai-hub' && (
                <AiAdvisoryHub
                  mapsApiKey={mapsApiKey}
                  onOpenEnquiry={() => handleOpenEnquiry()}
                />
              )}

              {currentRoute === '/contact' && (
                <ContactSection
                  clientId={clientId}
                  preselectedService={preselectedService}
                  selectedScopeServices={selectedScopeServices}
                  mapsApiKey={mapsApiKey}
                  onLeadSubmitted={(lead) => {
                    setVisitor((prev) =>
                      prev
                        ? { ...prev, name: lead.name, email: lead.email }
                        : {
                            client_id: clientId,
                            name: lead.name,
                            email: lead.email,
                            country: null,
                            phone: null,
                            visit_count: 1,
                            has_booked_free_consult: 0,
                            last_seen_at: new Date().toISOString(),
                          }
                    );
                  }}
                  onOpenChat={() => setChatOpen(true)}
                  onOpenAiHub={() => navigate('/ai-hub')}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <Footer onNavigate={(route) => navigate(route)} />
        </main>

        <LiveChatWidget
          clientId={clientId}
          clientName={visitor?.name}
          clientEmail={visitor?.email}
          advisorPublicKey={advisorPublicKey}
          advisorFingerprint={advisorFingerprint}
          open={chatOpen}
          onOpenChange={setChatOpen}
          onOpenEnquiry={() => handleOpenEnquiry()}
        />
      </div>
    </MotionConfig>
  );
}
