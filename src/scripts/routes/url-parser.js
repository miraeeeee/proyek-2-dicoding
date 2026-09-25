// src/scripts/routes/url-parser.js
function extractPathnameSegments(path) {
  const parts = path.split('/').filter(Boolean); // ['detail', 'story-123']
  return {
    resource: parts[0] || null,
    id: parts[1] || null,
  };
}

/** Build key untuk lookup routes, contoh: "/detail/:id" */
function constructRouteKey(segments) {
  if (!segments.resource) return '/';
  return segments.id ? `/${segments.resource}/:id` : `/${segments.resource}`;
}

/** Ambil pathname dari hash */
export function getActivePathname() {
  return location.hash.replace(/^#/, '') || '/';
}

/** Return key route (misal "/detail/:id") */
export function getActiveRouteKey() {
  const pathname = getActivePathname();
  const segments = extractPathnameSegments(pathname);
  return constructRouteKey(segments);
}

/** Return segments {resource, id} */
export function parseActivePathname() {
  return extractPathnameSegments(getActivePathname());
}

/** Helper untuk route statis atau dynamic */
export function getRouteKey(pathname) {
  const segments = extractPathnameSegments(pathname);
  return constructRouteKey(segments);
}