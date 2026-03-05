import { error, fail, redirect } from '@sveltejs/kit';
import { allGalleryTags, getGalleryById, upsertGallery } from '$lib/server/cms-store';
import { processImageUpload } from '$lib/server/media';

export async function load({ params }) {
  return { item: getGalleryById(params.id), tags: allGalleryTags() };
}

export const actions = {
  save: async ({ request, params }) => {
    const form = await request.formData();
    const existing = getGalleryById(params.id);
    if (!existing) throw error(404, 'Gallery item not found');

    const tags = String(form.get('tags') || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const upload = form.get('image');
    const processed = upload instanceof File && upload.size > 0 ? await processImageUpload(upload, 'gallery-item') : null;

    upsertGallery({
      id: String(form.get('id') || params.id),
      type: 'image',
      src: processed?.original || existing.src,
      srcVariants: {
        webp: processed?.webp?.[0]?.src || existing.srcVariants?.webp || '',
        jpg: processed?.jpg?.[0]?.src || existing.srcVariants?.jpg || ''
      },
      alt: String(form.get('alt') || ''),
      tags
    });

    throw redirect(303, '/admin/gallery');
  }
};
