import { fail, redirect } from '@sveltejs/kit';
import { isAdminAuthenticated, readCMS, validateAdminCredentials, writeCMS } from '$lib/server/cms-store';

export async function load({ cookies }) {
  const authenticated = isAdminAuthenticated(cookies);
  const cms = authenticated ? await readCMS() : null;
  return { authenticated, cms };
}

export const actions = {
  login: async ({ request, cookies }) => {
    const form = await request.formData();
    const username = String(form.get('username') || '');
    const password = String(form.get('password') || '');

    if (!validateAdminCredentials(username, password)) {
      return fail(400, { error: 'Invalid credentials' });
    }

    cookies.set('cms_admin', '1', { path: '/', httpOnly: true, sameSite: 'lax', secure: false, maxAge: 60 * 60 * 24 });
    throw redirect(303, '/admin');
  },

  logout: async ({ cookies }) => {
    cookies.delete('cms_admin', { path: '/' });
    throw redirect(303, '/admin');
  },

  saveEvent: async ({ request, cookies }) => {
    if (!isAdminAuthenticated(cookies)) throw redirect(303, '/admin');

    const form = await request.formData();
    const slug = String(form.get('slug') || '').trim();
    if (!slug) return fail(400, { error: 'Slug is required' });

    const event = {
      slug,
      title: {
        el: String(form.get('title_el') || '').trim(),
        de: String(form.get('title_de') || '').trim()
      },
      date: String(form.get('date') || '').trim(),
      excerpt: {
        el: String(form.get('excerpt_el') || '').trim(),
        de: String(form.get('excerpt_de') || '').trim()
      },
      image: String(form.get('image') || '').trim(),
      content: {
        el: String(form.get('content_el') || '').trim(),
        de: String(form.get('content_de') || '').trim()
      }
    };

    const cms = await readCMS();
    const idx = cms.events.findIndex((e) => e.slug === slug);
    if (idx >= 0) cms.events[idx] = event;
    else cms.events.unshift(event);

    await writeCMS(cms);
    throw redirect(303, '/admin');
  },

  deleteEvent: async ({ request, cookies }) => {
    if (!isAdminAuthenticated(cookies)) throw redirect(303, '/admin');

    const form = await request.formData();
    const slug = String(form.get('slug') || '');
    const cms = await readCMS();
    cms.events = cms.events.filter((e) => e.slug !== slug);
    await writeCMS(cms);
    throw redirect(303, '/admin');
  },

  saveGallery: async ({ request, cookies }) => {
    if (!isAdminAuthenticated(cookies)) throw redirect(303, '/admin');

    const form = await request.formData();
    const id = String(form.get('id') || `g-${Date.now()}`);
    const item = {
      id,
      type: 'image',
      src: String(form.get('src') || '').trim(),
      alt: String(form.get('alt') || '').trim()
    };

    if (!item.src) return fail(400, { error: 'Image URL is required' });

    const cms = await readCMS();
    const idx = cms.gallery.findIndex((g) => g.id === id);
    if (idx >= 0) cms.gallery[idx] = item;
    else cms.gallery.unshift(item);

    await writeCMS(cms);
    throw redirect(303, '/admin');
  },

  deleteGallery: async ({ request, cookies }) => {
    if (!isAdminAuthenticated(cookies)) throw redirect(303, '/admin');

    const form = await request.formData();
    const id = String(form.get('id') || '');
    const cms = await readCMS();
    cms.gallery = cms.gallery.filter((g) => g.id !== id);
    await writeCMS(cms);
    throw redirect(303, '/admin');
  }
};
