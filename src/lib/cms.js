const CMS_BASE_URL = import.meta.env.VITE_CMS_BASE_URL || 'https://gv-hellas.ch/wp-json/wp/v2';
const CMS_TIMEOUT_MS = Number(import.meta.env.VITE_CMS_TIMEOUT_MS || 2500);

const fallbackEvents = [
  {
    slug: 'fasnachtfeier-2025',
    title: { el: 'Αποκριάτικο Πάρτυ 2025', de: 'Fasnachtfeier 2025' },
    date: '2025-02-14',
    excerpt: {
      el: 'Πρόσκληση για το αποκριάτικο πάρτυ του συλλόγου το 2025.',
      de: 'Einladung zur Fasnachtfeier des Vereins im Jahr 2025.'
    },
    image: 'https://gv-hellas.ch/wp-content/uploads/2025/01/fasnachtfeier.jpg',
    content: {
      el: '<p>Πλούσιο πρόγραμμα με μουσική και χορό.</p>',
      de: '<p>Ein buntes Programm mit Musik und Tanz.</p>'
    }
  },
  {
    slug: 'generalversammlung-2025',
    title: { el: 'Κοπή πίτας – Γενική συνέλευση 2025', de: 'Generalversammlung 2025 (Kuchenschneiden)' },
    date: '2025-01-19',
    excerpt: {
      el: 'Σας προσκαλούμε στην ετήσια γενική συνέλευση και κοπή πίτας.',
      de: 'Wir laden Sie zur jährlichen Generalversammlung und Kuchenschneiden ein.'
    },
    image: 'https://gv-hellas.ch/wp-content/uploads/2025/01/generalversammlung.jpg',
    content: {
      el: '<p>Ελάτε να συζητήσουμε τα πεπραγμένα της χρονιάς.</p>',
      de: '<p>Kommen Sie, um das vergangene Jahr zu besprechen.</p>'
    }
  }
];

const fallbackLinks = [
  { name: { el: 'Πρεσβεία της Ελλάδος στη Βέρνη', de: 'Botschaft von Griechenland in Bern' }, url: 'https://www.mfa.gr' },
  { name: { el: 'Κοινότητα Rothrist', de: 'Gemeinde Rothrist' }, url: 'https://www.rothrist.ch' },
  { name: { el: 'Ιερά Μητρόπολη Ελβετίας', de: 'Heilige Metropolie der Schweiz' }, url: 'https://dioceseorthodoxe.ch' }
];

const fallbackBusinesses = [
  { name: 'ssr-rothrist.ch', url: 'https://ssr-rothrist.ch' },
  { name: 'physiomurgenthal.ch', url: 'https://physiomurgenthal.ch' },
  { name: 'zahnarztaarburgoftringen.ch', url: 'https://zahnarztaarburgoftringen.ch' },
  { name: 'zahnarztpraxisturbenthal.ch', url: 'https://zahnarztpraxisturbenthal.ch' }
];

const fallbackGallery = [
  { type: 'image', src: 'https://gv-hellas.ch/wp-content/uploads/2024/06/gruendung-1.jpg', alt: 'Gründung des Vereins' },
  { type: 'image', src: 'https://gv-hellas.ch/wp-content/uploads/2024/06/gruendung-2.jpg', alt: 'Gründung des Vereins' },
  { type: 'image', src: 'https://gv-hellas.ch/wp-content/uploads/2024/06/fasnacht-2023-1.jpg', alt: 'Fasnacht 2023' }
];

function stripHtml(value = '') {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function mapWordpressEvent(post) {
  const title = stripHtml(post?.title?.rendered) || 'GV Hellas Event';
  const excerpt = stripHtml(post?.excerpt?.rendered) || '';
  const content = post?.content?.rendered || '<p></p>';
  const image = post?._embedded?.['wp:featuredmedia']?.[0]?.source_url || null;

  return {
    slug: post.slug,
    title: { el: title, de: title },
    date: post.date,
    excerpt: { el: excerpt, de: excerpt },
    image,
    content: { el: content, de: content }
  };
}

async function fetchFromCMS(endpoint, params = {}, fetchImpl = fetch) {
  if (!CMS_BASE_URL) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CMS_TIMEOUT_MS);

  try {
    const url = new URL(`${CMS_BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    const res = await fetchImpl(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`CMS fetch failed: ${res.status}`);

    return res.json();
  } catch (error) {
    console.warn('CMS request failed, using fallback data.', error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getEvents({ fetch: fetchImpl } = {}) {
  const data = await fetchFromCMS('/posts', { per_page: 24, _embed: 1, status: 'publish' }, fetchImpl);
  if (Array.isArray(data) && data.length > 0) return data.map(mapWordpressEvent);
  return fallbackEvents;
}

export async function getEvent(slug, { fetch: fetchImpl } = {}) {
  const data = await fetchFromCMS('/posts', { slug, _embed: 1, status: 'publish' }, fetchImpl);
  if (Array.isArray(data) && data.length > 0) return mapWordpressEvent(data[0]);

  const events = await getEvents({ fetch: fetchImpl });
  return events.find((event) => event.slug === slug) || null;
}

export async function getUsefulLinks() {
  return fallbackLinks;
}

export async function getBusinesses() {
  return fallbackBusinesses;
}

export async function getGallery({ fetch: fetchImpl } = {}) {
  const media = await fetchFromCMS('/media', { per_page: 18, media_type: 'image' }, fetchImpl);

  if (Array.isArray(media) && media.length > 0) {
    return media
      .filter((item) => item?.source_url)
      .map((item) => ({
        type: 'image',
        src: item.source_url,
        alt: item.alt_text || stripHtml(item.title?.rendered) || 'GV Hellas'
      }));
  }

  return fallbackGallery;
}
