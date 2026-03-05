const CMS_BASE_URL = import.meta.env.VITE_CMS_BASE_URL || '/api/content';
const CMS_TIMEOUT_MS = Number(import.meta.env.VITE_CMS_TIMEOUT_MS || 5000);

async function fetchFromCMS(endpoint: string, fetchImpl: typeof fetch = fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CMS_TIMEOUT_MS);

  try {
    const res = await fetchImpl(`${CMS_BASE_URL}${endpoint}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`CMS fetch failed: ${res.status}`);
    return res.json();
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    console.warn('CMS request failed, using fallback data.', error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

const fallback = {
  events: [],
  links: [],
  businesses: [],
  gallery: []
};

export async function getEvents({ fetch: fetchImpl }: { fetch?: typeof fetch } = {}) {
  const data = await fetchFromCMS('/events', fetchImpl);
  return Array.isArray(data) && data.length ? data : fallback.events;
}

export async function getEvent(slug: string, { fetch: fetchImpl }: { fetch?: typeof fetch } = {}) {
  const data = await fetchFromCMS(`/events/${slug}`, fetchImpl);
  if (data) return data;
  const events = await getEvents({ fetch: fetchImpl });
  return events.find((event) => event.slug === slug) || null;
}

export async function getUsefulLinks({ fetch: fetchImpl }: { fetch?: typeof fetch } = {}) {
  const data = await fetchFromCMS('/links', fetchImpl);
  return Array.isArray(data) ? data : fallback.links;
}

export async function getBusinesses({ fetch: fetchImpl }: { fetch?: typeof fetch } = {}) {
  const data = await fetchFromCMS('/businesses', fetchImpl);
  return Array.isArray(data) ? data : fallback.businesses;
}

export async function getGallery({ fetch: fetchImpl }: { fetch?: typeof fetch } = {}) {
  const data = await fetchFromCMS('/gallery', fetchImpl);
  return Array.isArray(data) ? data : fallback.gallery;
}
