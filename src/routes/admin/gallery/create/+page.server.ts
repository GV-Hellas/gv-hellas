import { fail, redirect } from '@sveltejs/kit';
import { allGalleryTags, upsertGallery } from '$lib/server/cms-store';
import { processImageUpload } from '$lib/server/media';

export async function load() {
  return { item: null, tags: allGalleryTags() };
}

export const actions = {
  save: async ({ request }) => {
    const form = await request.formData();
    const upload = form.get('image');
    if (!(upload instanceof File) || upload.size === 0) return fail(400, { error: 'Image required' });

    const tags = String(form.get('tags') || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const processed = await processImageUpload(upload, 'gallery-item');

    upsertGallery({
      id: String(form.get('id') || `g-${Date.now()}`),
      type: 'image',
      src: processed?.original || '',
      srcVariants: { webp: processed?.webp?.[0]?.src || '', jpg: processed?.jpg?.[0]?.src || '' },
      alt: String(form.get('alt') || ''),
      tags
    });

    throw redirect(303, '/admin/gallery');
  }
};
