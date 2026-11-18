import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { BookingAndPaymentSection } from './components/BookingAndPaymentSection';
import { ContactSection } from './components/ContactSection';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
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
    fetch(`/api/bootstrap?clientId=${encodeURIComponent(clientId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.advisorPublicKey) setAdvisorPublicKey(data.advisorPublicKey);
        if (data.advisorFingerprint) setAdvisorFingerprint(data.advisorFingerprint);
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

  const handleBookFreeCall = (serviceTitle?: string) => {
    if (serviceTitle) {
      setPreselectedService(serviceTitle);
    }
    trackEvent('cta_click', 'booking', serviceTitle || 'Book Free Consultation');
    navigate('/consultation', { serviceTitle });
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
        <Navbar
          currentRoute={currentRoute}
          onNavigate={(route) => navigate(route)}
          onBookFreeCall={() => handleBookFreeCall()}
        />

        {currentRoute === '/dashboard' ? (
          <ExecutiveDashboard
            clientId={clientId}
            onReturnToWebsite={() => navigate('/')}
            onBookFreeCall={() => handleBookFreeCall()}
          />
        ) : (
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
                    onBookFreeCall={handleBookFreeCall}
                  />
                )}

                {currentRoute === '/services' && (
                  <ServicesAndProcessSection
                    initialPillar={servicesPillar}
                    selectedScopeServices={selectedScopeServices}
                    onToggleScopeService={handleToggleScopeService}
                    onSelectServiceForBooking={(title) => handleBookFreeCall(title)}
                    onBookWithScope={() => handleBookFreeCall()}
                    onEnquireWithScope={() => navigate('/contact')}
                  />
                )}

                {currentRoute === '/portfolio' && (
                  <PortfolioSection
                    onBookForBlueprint={(title) => handleBookFreeCall(title)}
                    onTrackEvent={trackEvent}
                  />
                )}

                {currentRoute === '/consultation' && (
                  <BookingAndPaymentSection
                    clientId={clientId}
                    preselectedService={preselectedService}
                    selectedScopeServices={selectedScopeServices}
                    visitor={visitor}
                    onVisitorIdentified={(v) => setVisitor(v)}
                    onAppointmentBooked={(bk) => {
                      setVisitor((prev) =>
                        prev
                          ? { ...prev, name: bk.name, email: bk.email, has_booked_free_consult: 1 }
                          : {
                              client_id: clientId,
                              name: bk.name,
                              email: bk.email,
                              country: bk.country,
                              phone: bk.phone,
                              visit_count: 1,
                              has_booked_free_consult: 1,
                              last_seen_at: new Date().toISOString(),
                            }
                      );
                    }}
                  />
                )}

                {currentRoute === '/contact' && (
                  <ContactSection
                    clientId={clientId}
                    selectedScopeServices={selectedScopeServices}
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
                    onBookFreeCall={() => handleBookFreeCall()}
                    onOpenChat={() => setChatOpen(true)}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            <Footer onNavigate={(route) => navigate(route)} />
          </main>
        )}

        <LiveChatWidget
          clientId={clientId}
          clientName={visitor?.name}
          clientEmail={visitor?.email}
          advisorPublicKey={advisorPublicKey}
          advisorFingerprint={advisorFingerprint}
          open={chatOpen}
          onOpenChange={setChatOpen}
          onBookFreeCall={() => handleBookFreeCall()}
        />
      </div>
    </MotionConfig>
  );
}
