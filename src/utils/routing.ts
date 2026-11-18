export type AppRoute =
  | '/'
  | '/services'
  | '/portfolio'
  | '/consultation'
  | '/contact'
  | '/dashboard';

const VALID_ROUTES = new Set<AppRoute>([
  '/',
  '/services',
  '/portfolio',
  '/consultation',
  '/contact',
  '/dashboard',
]);

export function parseAppRoute(pathname: string, hash = ''): AppRoute {
  if (hash === '#dashboard') return '/dashboard';
  const normalized = pathname.replace(/\/+$/, '') || '/';
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
    case '/consultation':
      return { title: 'Free Strategy Consultation — GROVIADS', section: 'consultation' };
    case '/contact':
      return { title: 'Project Enquiry & Contact — GROVIADS', section: 'contact' };
    case '/dashboard':
      return { title: 'Activity Console — GROVIADS', section: 'dashboard' };
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
