/**
 * Abstraction layer for communicating with the headless CMS. All
 * CMS-related logic should live in this module. By centralising
 * these functions it's easy to swap to a different CMS or adjust
 * endpoints without touching the rest of the codebase.
 *
 * The default implementation below expects a headless CMS
 * exposing REST or GraphQL endpoints. For example, you could
 * configure Sanity with the Sanity Content Lake API or Strapi
 * with its REST API. The functions return mock data so the
 * application remains functional without a real backend.
 */

const CMS_BASE_URL = import.meta.env.VITE_CMS_BASE_URL || '';

/**
 * Fetch data from a CMS endpoint. You can customise this
 * function to add headers (e.g. auth tokens) or to handle
 * different response formats.
 * @param {string} endpoint Relative API path
 * @returns {Promise<any>} JSON data from the API
 */
async function fetchFromCMS(endpoint) {
  if (!CMS_BASE_URL) {
    // Return empty or mock data when CMS base URL is not defined
    return null;
  }
  const res = await fetch(`${CMS_BASE_URL}${endpoint}`);
  if (!res.ok) {
    throw new Error(`CMS fetch failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Retrieve a list of events. Events should include a slug, title,
 * date, description and any images or videos associated with them.
 * @returns {Promise<Array>} List of events
 */
export async function getEvents() {
  const data = await fetchFromCMS('/events');
  if (data) return data;
  // Mock data fallback
  return [
    {
      slug: 'fasnachtfeier-2025',
      title: {
        el: 'Αποκριάτικο Πάρτυ 2025',
        de: 'Fasnachtfeier 2025'
      },
      date: '2025-02-14',
      excerpt: {
        el: 'Πρόσκληση για το αποκριάτικο πάρτυ του συλλόγου το 2025.',
        de: 'Einladung zur Fasnachtfeier des Vereins im Jahr 2025.'
      },
      image: '/images/fasnachtfeier.jpg',
      content: {
        el: '<p>Πλούσιο πρόγραμμα με μουσική και χορό.</p>',
        de: '<p>Ein buntes Programm mit Musik und Tanz.</p>'
      }
    },
    {
      slug: 'generalversammlung-2025',
      title: {
        el: 'Κοπή πίτας – Γενική συνέλευση 2025',
        de: 'Generalversammlung 2025 (Kuchenschneiden)'
      },
      date: '2025-01-19',
      excerpt: {
        el: 'Σας προσκαλούμε στην ετήσια γενική συνέλευση και κοπή πίτας.',
        de: 'Wir laden Sie zur jährlichen Generalversammlung und Kuchenschneiden ein.'
      },
      image: '/images/generalversammlung.jpg',
      content: {
        el: '<p>Ελάτε να συζητήσουμε τα πεπραγμένα της χρονιάς.</p>',
        de: '<p>Kommen Sie, um das vergangene Jahr zu besprechen.</p>'
      }
    }
  ];
}

/**
 * Retrieve a specific event by slug.
 * @param {string} slug The event slug
 * @returns {Promise<Object|null>} Event data or null if not found
 */
export async function getEvent(slug) {
  const events = await getEvents();
  return events.find((e) => e.slug === slug) || null;
}

/**
 * Retrieve useful links. Each link has a name and URL. This could
 * be managed in the CMS as a simple list of entries.
 */
export async function getUsefulLinks() {
  const data = await fetchFromCMS('/links');
  if (data) return data;
  return [
    { name: { el: 'Πρεσβεία της Ελλάδος στη Βέρνη', de: 'Botschaft von Griechenland in Bern' }, url: 'https://www.mfa.gr' },
    { name: { el: 'Κοινότητα Rothrist', de: 'Gemeinde Rothrist' }, url: 'https://www.rothrist.ch' },
    { name: { el: 'Ιερά Μητρόπολη Ελβετίας', de: 'Heilige Metropolie der Schweiz' }, url: 'https://dioceseorthodoxe.ch' }
  ];
}

/**
 * Retrieve sponsors or businesses. The structure is similar to the
 * useful links and can include optional logos.
 */
export async function getBusinesses() {
  const data = await fetchFromCMS('/businesses');
  if (data) return data;
  return [
    { name: 'ssr-rothrist.ch', url: 'https://ssr-rothrist.ch' },
    { name: 'physiomurgenthal.ch', url: 'https://physiomurgenthal.ch' },
    { name: 'zahnarztaarburgoftringen.ch', url: 'https://zahnarztaarburgoftringen.ch' },
    { name: 'zahnarztpraxisturbenthal.ch', url: 'https://zahnarztpraxisturbenthal.ch' }
  ];
}

/**
 * Retrieve gallery items. A gallery item can be a photo or video URL.
 */
export async function getGallery() {
  const data = await fetchFromCMS('/gallery');
  if (data) return data;
  return [
    { type: 'image', src: '/images/gallery/gruendung-1.jpg', alt: 'Gründung des Vereins' },
    { type: 'image', src: '/images/gallery/gruendung-2.jpg', alt: 'Gründung des Vereins' },
    { type: 'image', src: '/images/gallery/fasnacht-2023-1.jpg', alt: 'Fasnacht 2023' }
  ];
}