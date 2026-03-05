import { fail, redirect } from '@sveltejs/kit';
import { allGalleryTags, getGalleryById, upsertGallery } from '$lib/server/cms-store';

export async function load({ params }) {
  return { item: getGalleryById(params.id), tags: allGalleryTags() };
}

export const actions = {
  save: async ({ request, params }) => {
    const form = await request.formData();
    const src = String(form.get('src') || '').trim();
    if (!src) return fail(400, { error: 'Image URL required' });

    const tags = String(form.get('tags') || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    upsertGallery({
      id: String(form.get('id') || params.id),
      type: 'image',
      src,
      srcVariants: { webp: [], jpg: [] },
      alt: String(form.get('alt') || ''),
      tags
    });

    throw redirect(303, '/admin/gallery');
  }
};
