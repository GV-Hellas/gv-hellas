import { error, fail, redirect } from '@sveltejs/kit';
import { getLinkById, upsertLink } from '$lib/server/cms-store';
import { processImageUpload } from '$lib/server/media';

export async function load({ params }) {
  const item = getLinkById(Number(params.id));
  if (!item) throw error(404, 'Link not found');
  return { item };
}

export const actions = {
  save: async ({ request, params }) => {
    const form = await request.formData();
    const url = String(form.get('url') || '').trim();
    if (!url) return fail(400, { error: 'URL required' });

    const existing = getLinkById(Number(params.id));
    if (!existing) throw error(404, 'Link not found');

    const upload = form.get('logo');
    const processed = upload instanceof File && upload.size > 0 ? await processImageUpload(upload, 'link-logo') : null;

    upsertLink({
      id: existing.id,
      name: { el: String(form.get('name_el') || ''), de: String(form.get('name_de') || '') },
      url,
      logo: processed?.original || existing.logo,
      logoVariants: {
        webp: processed?.webp?.[0]?.src || existing.logoVariants?.webp || '',
        jpg: processed?.jpg?.[0]?.src || existing.logoVariants?.jpg || ''
      }
    });

    throw redirect(303, '/admin/links');
  }
};
