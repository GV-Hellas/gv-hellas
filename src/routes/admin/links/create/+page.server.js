import { fail, redirect } from '@sveltejs/kit';
import { upsertLink } from '$lib/server/cms-store';
import { processImageUpload } from '$lib/server/media';

export const actions = {
  save: async ({ request }) => {
    const form = await request.formData();
    const url = String(form.get('url') || '').trim();
    if (!url) return fail(400, { error: 'URL required' });

    const upload = form.get('logo');
    const processed = upload instanceof File ? await processImageUpload(upload, 'link-logo') : null;

    upsertLink({
      name: { el: String(form.get('name_el') || ''), de: String(form.get('name_de') || '') },
      url,
      logo: processed?.original || '',
      logoVariants: { webp: processed?.webp?.[0]?.src || '', jpg: processed?.jpg?.[0]?.src || '' }
    });

    throw redirect(303, '/admin/links');
  }
};
