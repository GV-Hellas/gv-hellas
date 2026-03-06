const CMS_BASE_URL = (import.meta.env.VITE_CMS_BASE_URL as string) || '/api/content';
const CMS_TIMEOUT_MS = Number(import.meta.env.VITE_CMS_TIMEOUT_MS || 5000);

type FetchImpl = typeof fetch;

type MultiLang = { el: string; de: string };

type ImageVariant = { width: number; src: string };

type EventItem = {
  slug: string;
  date: string;
  title: MultiLang;
  excerpt: MultiLang;
  image: string;
  imageVariants?: { webp?: string | ImageVariant[]; jpg?: string | ImageVariant[] };
  content: MultiLang;
  mediaBlocks: unknown[];
};

type LinkItem = { id?: number; name: MultiLang; url: string; logo?: string };
type BusinessItem = { id?: number; name: string; url: string; logo?: string };
type GalleryItem = {
  id: string;
  type: string;
  src: string;
  srcVariants?: { webp?: string | ImageVariant[]; jpg?: string | ImageVariant[] };
  alt: string;
  tags: string[];
};
type EquipmentItem = {
  id: number;
  name: string;
  brand: string;
  modelYear: string;
  description: string;
  pricePerDay: number;
  video: string;
  images: Array<{ src: string; variants: { webp?: string; jpg?: string } }>;
};

interface FetchOptions {
  fetch?: FetchImpl;
}

async function fetchFromCMS<T>(endpoint: string, fetchImpl: FetchImpl = fetch): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CMS_TIMEOUT_MS);

  try {
    const res = await fetchImpl(`${CMS_BASE_URL}${endpoint}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`CMS fetch failed: ${res.status}`);
    return (await res.json()) as T;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    console.warn('CMS request failed, using fallback data.', error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

const fallback = {
  events: [] as EventItem[],
  links: [] as LinkItem[],
  businesses: [] as BusinessItem[],
  gallery: [] as GalleryItem[],
  equipment: [] as EquipmentItem[]
};

export async function getEvents({ fetch: fetchImpl }: FetchOptions = {}): Promise<EventItem[]> {
  const data = await fetchFromCMS<EventItem[]>('/events', fetchImpl);
  return Array.isArray(data) && data.length ? data : fallback.events;
}

export async function getEvent(slug: string, { fetch: fetchImpl }: FetchOptions = {}): Promise<EventItem | null> {
  const data = await fetchFromCMS<EventItem>(`/events/${slug}`, fetchImpl);
  if (data) return data;
  const events = await getEvents({ fetch: fetchImpl });
  return events.find((event) => event.slug === slug) || null;
}

export async function getUsefulLinks({ fetch: fetchImpl }: FetchOptions = {}): Promise<LinkItem[]> {
  const data = await fetchFromCMS<LinkItem[]>('/links', fetchImpl);
  return Array.isArray(data) ? data : fallback.links;
}

export async function getBusinesses({ fetch: fetchImpl }: FetchOptions = {}): Promise<BusinessItem[]> {
  const data = await fetchFromCMS<BusinessItem[]>('/businesses', fetchImpl);
  return Array.isArray(data) ? data : fallback.businesses;
}

export async function getGallery({ fetch: fetchImpl }: FetchOptions = {}): Promise<GalleryItem[]> {
  const data = await fetchFromCMS<GalleryItem[]>('/gallery', fetchImpl);
  return Array.isArray(data) ? data : fallback.gallery;
}

export async function getEquipment({ fetch: fetchImpl }: FetchOptions = {}): Promise<EquipmentItem[]> {
  const data = await fetchFromCMS<EquipmentItem[]>('/equipment', fetchImpl);
  return Array.isArray(data) ? data : fallback.equipment;
}
