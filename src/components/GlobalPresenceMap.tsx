import {
  APILoadingStatus,
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { ExternalLink, Globe2, Loader2, MapPin, Search } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';

interface DeliveryHub {
  id: string;
  label: string;
  region: string;
  timezone: string;
  focus: string;
  position: { lat: number; lng: number };
}

const GROVIADS_DELIVERY_HUBS: DeliveryHub[] = [
  {
    id: 'hub-apac',
    label: 'GROVIADS APAC & India Desk',
    region: 'New Delhi / IST',
    timezone: 'IST (GMT+5:30)',
    focus: 'Core Engineering, AI Automation & Global Delivery',
    position: { lat: 28.6139, lng: 77.209 },
  },
  {
    id: 'hub-americas',
    label: 'GROVIADS Americas Desk',
    region: 'New York / EST',
    timezone: 'EST (GMT-5)',
    focus: 'Performance Marketing, CRO & Enterprise Advisory',
    position: { lat: 40.7128, lng: -74.006 },
  },
  {
    id: 'hub-emea',
    label: 'GROVIADS EMEA Desk',
    region: 'London / GMT',
    timezone: 'GMT (UTC+0)',
    focus: 'SEO Architecture, Cloud Integrations & BI',
    position: { lat: 51.5072, lng: -0.1276 },
  },
];

interface LivePlacePin {
  id: string;
  name: string;
  address: string;
  mapsUri?: string;
  position: { lat: number; lng: number };
}

function HubMarker({
  hub,
  selected,
  onSelect,
}: {
  hub: DeliveryHub;
  selected: boolean;
  onSelect: () => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={hub.position}
        title={hub.label}
        onClick={onSelect}
      >
        <Pin background="#1D4ED8" borderColor="#0B1215" glyphColor="#FFFFFF" />
      </AdvancedMarker>
      {selected && marker && (
        <InfoWindow anchor={marker} maxWidth={260} onCloseClick={onSelect}>
          <div className="p-1 text-slate-900">
            <p className="font-bold text-xs text-[#0B1215]">{hub.label}</p>
            <p className="text-[11px] text-[#1D4ED8] font-medium mt-0.5">
              {hub.region} · {hub.timezone}
            </p>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">{hub.focus}</p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function SearchedPlaceMarker({
  place,
  selected,
  onSelect,
}: {
  place: LivePlacePin;
  selected: boolean;
  onSelect: () => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={place.position}
        title={place.name}
        onClick={onSelect}
      >
        <Pin background="#0F172A" borderColor="#60A5FA" glyphColor="#60A5FA" />
      </AdvancedMarker>
      {selected && marker && (
        <InfoWindow anchor={marker} maxWidth={260} onCloseClick={onSelect}>
          <div className="p-1 text-slate-900">
            <p className="font-bold text-xs text-[#0B1215]">{place.name}</p>
            {place.address && (
              <p className="text-[11px] text-slate-600 mt-0.5">{place.address}</p>
            )}
            {place.mapsUri && (
              <a
                href={place.mapsUri}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1D4ED8] hover:underline mt-1.5"
              >
                View on Google Maps
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function MapCanvasInner({
  selectedHubId,
  onSelectHub,
}: {
  selectedHubId: string | null;
  onSelectHub: (id: string | null) => void;
}) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const loadingStatus = useApiLoadingStatus();

  const [queryText, setQueryText] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchedPlaces, setSearchedPlaces] = useState<LivePlacePin[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  useEffect(() => {
    if (!map || !selectedHubId) return;
    const hub = GROVIADS_DELIVERY_HUBS.find((h) => h.id === selectedHubId);
    if (hub) {
      map.panTo(hub.position);
      map.setZoom(5);
    }
  }, [map, selectedHubId]);

  const handlePlacesSearch = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const trimmed = queryText.trim();
      if (!trimmed || !placesLib) return;
      setSearching(true);
      setSearchError(null);

      try {
        const { places } = await placesLib.Place.searchByText({
          textQuery: trimmed,
          fields: ['id', 'displayName', 'formattedAddress', 'location', 'googleMapsURI'],
          maxResultCount: 5,
        });

        const nextPins: LivePlacePin[] = [];
        for (const p of places ?? []) {
          const loc = p.location;
          if (!loc) continue;
          const lat = typeof loc.lat === 'function' ? loc.lat() : Number(loc.lat);
          const lng = typeof loc.lng === 'function' ? loc.lng() : Number(loc.lng);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            nextPins.push({
              id: p.id || `${lat}_${lng}`,
              name: p.displayName || trimmed,
              address: p.formattedAddress || '',
              mapsUri: p.googleMapsURI || undefined,
              position: { lat, lng },
            });
          }
        }

        setSearchedPlaces(nextPins);
        if (nextPins.length > 0 && map) {
          onSelectHub(null);
          setSelectedPlaceId(nextPins[0].id);
          map.panTo(nextPins[0].position);
          map.setZoom(11);
        } else {
          setSearchError('No matching locations returned by Google Maps.');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('OVER_QUERY_LIMIT') ||
          msg.includes('429') ||
          msg.includes('Quota')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        setSearchError('Unable to query Places right now. Please try again later.');
      } finally {
        setSearching(false);
      }
    },
    [queryText, placesLib, map, onSelectHub]
  );

  if (
    loadingStatus === APILoadingStatus.FAILED ||
    loadingStatus === APILoadingStatus.AUTH_FAILURE
  ) {
    return (
      <div className="h-[380px] w-full rounded-xl bg-[#0B1215] border border-slate-800 flex items-center justify-center p-6 text-center text-slate-300 text-sm">
        Unable to load the interactive Google Map. Please check network connectivity or API key
        configuration.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handlePlacesSearch} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Search a city, district, or business hub via Places API (New)..."
            aria-label="Search locations via Google Maps Places"
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1D4ED8]"
          />
        </div>
        <button
          type="submit"
          disabled={searching || !placesLib}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B1215] hover:bg-[#1D4ED8] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          Locate on Map
        </button>
      </form>

      {searchError && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {searchError}
        </p>
      )}

      <div className="h-[380px] sm:h-[420px] w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
        <GoogleMap
          mapId="DEMO_MAP_ID"
          defaultCenter={GROVIADS_DELIVERY_HUBS[0].position}
          defaultZoom={3}
          gestureHandling="cooperative"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
        >
          {GROVIADS_DELIVERY_HUBS.map((hub) => (
            <HubMarker
              key={hub.id}
              hub={hub}
              selected={selectedHubId === hub.id}
              onSelect={() => {
                setSelectedPlaceId(null);
                onSelectHub(selectedHubId === hub.id ? null : hub.id);
              }}
            />
          ))}
          {searchedPlaces.map((place) => (
            <SearchedPlaceMarker
              key={place.id}
              place={place}
              selected={selectedPlaceId === place.id}
              onSelect={() => {
                onSelectHub(null);
                setSelectedPlaceId(selectedPlaceId === place.id ? null : place.id);
              }}
            />
          ))}
        </GoogleMap>
      </div>
    </div>
  );
}

interface GlobalPresenceMapProps {
  apiKey?: string;
}

export function GlobalPresenceMap({ apiKey }: GlobalPresenceMapProps) {
  const [selectedHubId, setSelectedHubId] = useState<string | null>('hub-apac');
  const resolvedKey = apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[#1D4ED8] flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5" />
            Google Maps Platform · Worldwide Delivery Coverage
          </p>
          <h3 className="font-display text-lg font-bold text-[#0B1215] mt-0.5">
            Interactive Global Delivery &amp; Places Explorer
          </h3>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {GROVIADS_DELIVERY_HUBS.map((hub) => {
            const active = selectedHubId === hub.id;
            return (
              <button
                key={hub.id}
                type="button"
                onClick={() => setSelectedHubId(hub.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#1D4ED8] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {hub.region.split(' / ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {!resolvedKey ? (
        <div className="h-[320px] w-full rounded-xl bg-[#0B1215] text-slate-300 border border-slate-800 flex flex-col items-center justify-center p-6 text-center gap-2">
          <MapPin className="w-6 h-6 text-[#60A5FA]" />
          <p className="text-sm font-semibold text-white">Google Maps Key Pending Runtime Reload</p>
          <p className="text-xs text-slate-400 max-w-md">
            Once the provisioned Maps API key is active in your runtime environment, this interactive
            map and Places API explorer will render automatically.
          </p>
        </div>
      ) : (
        <APIProvider
          apiKey={resolvedKey}
          libraries={['places', 'marker']}
          language="en"
          region="US"
        >
          <MapCanvasInner selectedHubId={selectedHubId} onSelectHub={setSelectedHubId} />
        </APIProvider>
      )}
    </div>
  );
}
