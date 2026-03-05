const CMS_BASE_URL = (import.meta.env.VITE_CMS_BASE_URL as string) || '/api/content';
const CMS_TIMEOUT_MS = Number(import.meta.env.VITE_CMS_TIMEOUT_MS || 5000);

// Defining a type for the fetch implementation (compatible with browser and SvelteKit fetch)
type Fetch = typeof fetch;

interface FetchOptions {
  fetch?: Fetch;
}

async function fetchFromCMS(endpoint: string, fetchImpl: Fetch = fetch): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CMS_TIMEOUT_MS);

  try {
    const res = await fetchImpl(`${CMS_BASE_URL}${endpoint}`, { signal: controller.signal });
    if (!res.ok)
      throw new Error(`CMS fetch failed: ${res.status}`);
    return await res.json();
  } catch (error: unknown) {
    // Fix TS2339 by checking if error is an instance of Error
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.warn('CMS request failed, using fallback data.', error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

const fallback = {
  events: [] as any[],
  links: [] as any[],
  businesses: [] as any[],
  gallery: [] as any[]
};

export async function getEvents({ fetch: fetchImpl }: FetchOptions = {}): Promise<any[]> {
  const data = await fetchFromCMS('/events', fetchImpl);
  return Array.isArray(data) && data.length ? data : fallback.events;
}

export async function getEvent(slug: string, { fetch: fetchImpl }: FetchOptions = {}): Promise<any | null> {
  const data = await fetchFromCMS(`/events/${slug}`, fetchImpl);
  if (data) return data;
  const events = await getEvents({ fetch: fetchImpl });
  return events.find((event) => event.slug === slug) || null;
}

export async function getUsefulLinks({ fetch: fetchImpl }: FetchOptions = {}): Promise<any[]> {
  const data = await fetchFromCMS('/links', fetchImpl);
  return Array.isArray(data) ? data : fallback.links;
}

export async function getBusinesses({ fetch: fetchImpl }: FetchOptions = {}): Promise<any[]> {
  const data = await fetchFromCMS('/businesses', fetchImpl);
  return Array.isArray(data) ? data : fallback.businesses;
}

export async function getGallery({ fetch: fetchImpl }: FetchOptions = {}): Promise<any[]> {
  const data = await fetchFromCMS('/gallery', fetchImpl);
  return Array.isArray(data) ? data : fallback.gallery;
}