import {
  Bot,
  Compass,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  Send,
  Sparkles,
} from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { GlobalPresenceMap } from './GlobalPresenceMap';

type HubMode = 'chat' | 'search' | 'maps';
type RolePreset = 'strategist' | 'architect' | 'analyst' | 'concierge';
type ChatModel = 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  model?: string;
}

interface SearchSource {
  title: string;
  uri: string;
}

interface MapsPlaceResult {
  title: string;
  uri: string;
  placeId?: string;
  reviewSnippets: string[];
}

interface AiAdvisoryHubProps {
  mapsApiKey?: string;
  onOpenEnquiry: () => void;
}

export function AiAdvisoryHub({ mapsApiKey, onOpenEnquiry }: AiAdvisoryHubProps) {
  const [mode, setMode] = useState<HubMode>('chat');

  // Multi-turn Chat state
  const [rolePreset, setRolePreset] = useState<RolePreset>('strategist');
  const [chatModel, setChatModel] = useState<ChatModel>('gemini-4-hydrogen');
  const [thinkingDepth, setThinkingDepth] = useState<'low' | 'high'>('low');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Welcome to the GROVIADS AI Advisory Studio. Choose an advisor role above and ask anything about digital marketing, SEO, custom software architecture, BI analytics, or automation.',
      model: 'gemini-4-hydrogen',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Search Grounding state
  const [searchPrompt, setSearchPrompt] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<{
    prompt: string;
    text: string;
    sources: SearchSource[];
  } | null>(null);

  // Maps Grounding state
  const [mapsPrompt, setMapsPrompt] = useState('');
  const [mapsCoords, setMapsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const [mapsResult, setMapsResult] = useState<{
    prompt: string;
    text: string;
    places: MapsPlaceResult[];
  } | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  const handleSendChat = async (e: FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatError(null);

    const historyForApi = chatMessages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, text: m.text }));

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: historyForApi,
          message: text,
          rolePreset,
          model: chatModel,
          thinkingDepth,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setChatError(data.error || 'Could not generate response.');
        return;
      }
      setChatMessages((prev) => [
        ...prev,
        {
          id: `m_${Date.now()}`,
          role: 'model',
          text: data.text || '(No response text returned)',
          model: data.model,
        },
      ]);
    } catch {
      setChatError('Network error communicating with advisory endpoint.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleRunSearchGrounding = async (e: FormEvent) => {
    e.preventDefault();
    const prompt = searchPrompt.trim();
    if (!prompt || searchLoading) return;
    setSearchError(null);
    setSearchLoading(true);
    try {
      const res = await fetch('/api/ai/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error || 'Search grounding request failed.');
        return;
      }
      setSearchResult({
        prompt,
        text: data.text || '',
        sources: Array.isArray(data.sources) ? data.sources : [],
      });
    } catch {
      setSearchError('Network error running Search grounding.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRequestGeolocation = () => {
    if (!navigator.geolocation) {
      setMapsError('Browser geolocation is unavailable in this session.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapsCoords({
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
        });
        setMapsError(null);
      },
      () => {
        setMapsError('Location permission denied — querying globally without device GPS.');
      }
    );
  };

  const handleRunMapsGrounding = async (e: FormEvent) => {
    e.preventDefault();
    const prompt = mapsPrompt.trim();
    if (!prompt || mapsLoading) return;
    setMapsError(null);
    setMapsLoading(true);
    try {
      const res = await fetch('/api/ai/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          ...(mapsCoords ? { latitude: mapsCoords.lat, longitude: mapsCoords.lng } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMapsError(data.error || 'Maps grounding request failed.');
        return;
      }
      setMapsResult({
        prompt,
        text: data.text || '',
        places: Array.isArray(data.places) ? data.places : [],
      });
    } catch {
      setMapsError('Network error running Maps grounding.');
    } finally {
      setMapsLoading(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC]">
      {/* Header Banner */}
      <section className="bg-[#0B1215] text-white border-b border-slate-800">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-12 lg:py-14">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-mono text-[#60A5FA] mb-3">
                GROVIADS / Interactive Intelligence Studio
              </p>
              <h1
                className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight"
                style={{ textWrap: 'balance' }}
              >
                AI Advisory &amp; Grounded Market Intelligence
              </h1>
              <p className="text-sm sm:text-base text-slate-300 mt-4 leading-relaxed">
                Scope your technical and growth roadmap with our multi-turn AI advisor, verify
                real-time market facts with Google Search, and explore locations with Google Maps.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onOpenEnquiry}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1D4ED8] hover:bg-[#2563EB] text-white text-xs sm:text-sm font-semibold cursor-pointer whitespace-nowrap"
              >
                Send Project Enquiry
              </button>
            </div>
          </div>

          {/* Mode Tabs */}
          <div
            role="tablist"
            aria-label="AI Hub capabilities"
            className="mt-8 flex flex-wrap gap-2"
          >
            {[
              { id: 'chat' as HubMode, label: 'Multi-Turn Advisor', icon: Bot },
              { id: 'search' as HubMode, label: 'Search Grounding', icon: Globe },
              { id: 'maps' as HubMode, label: 'Maps Grounding & Explorer', icon: MapPin },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setMode(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#1D4ED8] text-white'
                      : 'bg-[#111B20] text-slate-300 border border-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Workspace */}
      <section className="py-12 lg:py-16 border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
          {mode === 'chat' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#0B1215]">
                    Multi-Turn Advisory Chat
                  </h2>
                  <p className="text-xs text-slate-500">
                    Maintains full conversation context across turns with role-specific framing.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Advisor role"
                    value={rolePreset}
                    onChange={(e) => setRolePreset(e.target.value as RolePreset)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800"
                  >
                    <option value="strategist">Role: Growth Strategist</option>
                    <option value="architect">Role: Solutions Architect</option>
                    <option value="analyst">Role: BI &amp; Analytics Lead</option>
                    <option value="concierge">Role: Client Concierge</option>
                  </select>

                  <select
                    aria-label="Model selection"
                    value={chatModel}
                    onChange={(e) => setChatModel(e.target.value as ChatModel)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800"
                  >
                    <option value="gemini-4-hydrogen">Balanced Advisor</option>
                    <option value="gemini-3.1-flash-lite">Fast Advisor</option>
                  </select>

                  {chatModel === 'gemini-4-hydrogen' && (
                    <select
                      aria-label="Reasoning depth"
                      value={thinkingDepth}
                      onChange={(e) => setThinkingDepth(e.target.value as 'low' | 'high')}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800"
                    >
                      <option value="low">Depth: Standard</option>
                      <option value="high">Depth: Deep</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Scrollable Conversation Thread */}
              <div className="h-[420px] overflow-y-auto space-y-3 pr-1">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-[#1D4ED8] text-white'
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}
                    >
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 px-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#1D4ED8]" />
                    Advisor thinking...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {chatError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800">
                  {chatError}
                </div>
              )}

              <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t border-slate-100">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about scaling organic traffic, SaaS architecture, CRM automation..."
                  className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1D4ED8]"
                />
                <button
                  type="submit"
                  disabled={chatLoading}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#0B1215] hover:bg-[#1D4ED8] disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </form>
            </div>
          )}

          {mode === 'search' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-5">
              <div>
                <h2 className="font-display text-lg font-bold text-[#0B1215] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#1D4ED8]" />
                  Google Search Grounded Market Intelligence
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Live web-grounded research with verifiable source citations.
                </p>
              </div>

              <form onSubmit={handleRunSearchGrounding} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={searchPrompt}
                  onChange={(e) => setSearchPrompt(e.target.value)}
                  placeholder="e.g. Latest Core Web Vitals updates & enterprise B2B SaaS SEO benchmarks"
                  className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1D4ED8]"
                />
                <button
                  type="submit"
                  disabled={searchLoading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-60 text-white text-sm font-semibold whitespace-nowrap cursor-pointer"
                >
                  {searchLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  Research Web
                </button>
              </form>

              {searchError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800">
                  {searchError}
                </div>
              )}

              {searchResult && (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-[#1D4ED8]">Grounded Answer</span>
                  </div>
                  <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {searchResult.text}
                  </div>
                  {searchResult.sources.length > 0 && (
                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-xs font-semibold text-[#0B1215] mb-2">
                        Verified Web Sources
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {searchResult.sources.map((src) => (
                          <a
                            key={src.uri}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#1D4ED8] text-xs text-[#1D4ED8] font-medium"
                          >
                            <span className="truncate max-w-[220px]">{src.title}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {mode === 'maps' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-bold text-[#0B1215] flex items-center gap-2">
                      <Compass className="w-4 h-4 text-[#1D4ED8]" />
                      Google Maps Grounded Location Intelligence
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Ask about regional business ecosystems, commercial hubs, or local services
                      with verified Google Maps citations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestGeolocation}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 cursor-pointer self-start"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#1D4ED8]" />
                    {mapsCoords ? `GPS: ${mapsCoords.lat}, ${mapsCoords.lng}` : 'Use My Location'}
                  </button>
                </div>

                <form onSubmit={handleRunMapsGrounding} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={mapsPrompt}
                    onChange={(e) => setMapsPrompt(e.target.value)}
                    placeholder="e.g. Top coworking and startup tech districts in Bengaluru or Austin"
                    className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1D4ED8]"
                  />
                  <button
                    type="submit"
                    disabled={mapsLoading}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-60 text-white text-sm font-semibold whitespace-nowrap cursor-pointer"
                  >
                    {mapsLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                    Query Maps
                  </button>
                </form>

                {mapsError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800">
                    {mapsError}
                  </div>
                )}

                {mapsResult && (
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-[#1D4ED8]">
                        Google Maps Grounded Output
                      </span>
                    </div>

                    <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {mapsResult.text}
                    </div>

                    {mapsResult.places.length > 0 && (
                      <div className="pt-3 border-t border-slate-200 space-y-2.5">
                        <p className="text-xs font-semibold text-[#0B1215]">
                          Google Maps Place Links &amp; Reviews
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {mapsResult.places.map((pl) => (
                            <div
                              key={pl.uri}
                              className="rounded-lg bg-white border border-slate-200 p-3 space-y-1.5"
                            >
                              <a
                                href={pl.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8] hover:underline"
                              >
                                <span>{pl.title}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                              {pl.reviewSnippets.slice(0, 2).map((snip, idx) => (
                                <p key={idx} className="text-[11px] text-slate-600 line-clamp-2">
                                  &ldquo;{snip}&rdquo;
                                </p>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <GlobalPresenceMap apiKey={mapsApiKey} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
