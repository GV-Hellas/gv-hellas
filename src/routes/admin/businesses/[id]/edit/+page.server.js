import { error, fail, redirect } from '@sveltejs/kit';
import { getBusinessById, upsertBusiness } from '$lib/server/cms-store';
import { processImageUpload } from '$lib/server/media';

export async function load({ params }) {
  const item = getBusinessById(Number(params.id));
  if (!item) throw error(404, 'Business not found');
  return { item };
}

export const actions = {
  save: async ({ request, params }) => {
    const existing = getBusinessById(Number(params.id));
    if (!existing) throw error(404, 'Business not found');

    const form = await request.formData();
    const name = String(form.get('name') || '').trim();
    const url = String(form.get('url') || '').trim();
    if (!name || !url) return fail(400, { error: 'Name and URL are required.' });

    const upload = form.get('logo');
    const processed = upload instanceof File && upload.size > 0 ? await processImageUpload(upload, 'business-logo') : null;

    upsertBusiness({
      id: existing.id,
      name,
      url,
      logo: processed?.original || existing.logo,
      logoVariants: {
        webp: processed?.webp?.[0]?.src || existing.logoVariants?.webp || '',
        jpg: processed?.jpg?.[0]?.src || existing.logoVariants?.jpg || ''
      }
    });

    throw redirect(303, '/admin/businesses');
  }
};
