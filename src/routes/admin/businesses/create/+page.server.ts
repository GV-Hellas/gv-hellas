import { fail, redirect } from '@sveltejs/kit';
import { upsertBusiness } from '$lib/server/cms-store';
import { processImageUpload } from '$lib/server/media';

export const actions = {
  save: async ({ request }) => {
    const form = await request.formData();
    const name = String(form.get('name') || '').trim();
    const url = String(form.get('url') || '').trim();
    const upload = form.get('logo');

    if (!name || !url) return fail(400, { error: 'Name and URL are required.' });
    if (!(upload instanceof File) || upload.size === 0) return fail(400, { error: 'Logo is mandatory.' });

    const processed = await processImageUpload(upload, 'business-logo');

    upsertBusiness({
      name,
      url,
      logo: processed?.original || '',
      logoVariants: { webp: processed?.webp?.[0]?.src || '', jpg: processed?.jpg?.[0]?.src || '' }
    });

    throw redirect(303, '/admin/businesses');
  }
};
