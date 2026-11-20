export type AppRoute =
  | '/'
  | '/services'
  | '/portfolio'
  | '/ai-hub'
  | '/contact';

const VALID_ROUTES = new Set<AppRoute>([
  '/',
  '/services',
  '/portfolio',
  '/ai-hub',
  '/contact',
]);

export function parseAppRoute(pathname: string, _hash = ''): AppRoute {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  if (normalized === '/enquiry' || normalized === '/consultation') {
    return '/contact';
  }
  if (VALID_ROUTES.has(normalized as AppRoute)) {
    return normalized as AppRoute;
  }
  return '/';
}

export function getPageMeta(route: AppRoute): { title: string; section: string } {
  switch (route) {
    case '/services':
      return { title: 'Services & Process — GROVIADS', section: 'services' };
    case '/portfolio':
      return { title: 'Solution Blueprints — GROVIADS', section: 'portfolio' };
    case '/ai-hub':
      return { title: 'AI Advisory Hub — GROVIADS', section: 'ai_hub' };
    case '/contact':
      return { title: 'Project Enquiry — GROVIADS', section: 'contact' };
    default:
      return { title: 'GROVIADS — Business Growth & Technology Solutions', section: 'home' };
  }
}

export function filterItemsByQuery<T extends { title: string; summary?: string; deliverables?: string[] }>(
  items: T[],
  query: string
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    if (item.title.toLowerCase().includes(q)) return true;
    if (item.summary && item.summary.toLowerCase().includes(q)) return true;
    if (item.deliverables && item.deliverables.some((d) => d.toLowerCase().includes(q))) return true;
    return false;
  });
}
