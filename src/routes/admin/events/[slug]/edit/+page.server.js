import { fail, redirect } from '@sveltejs/kit';
import { getEventBySlug, upsertEvent } from '$lib/server/cms-store';

export async function load({ params }) {
  return { event: getEventBySlug(params.slug) };
}

export const actions = {
  save: async ({ request, params }) => {
    const form = await request.formData();
    const slug = String(form.get('slug') || params.slug).trim();
    if (!slug) return fail(400, { error: 'Slug required' });

    upsertEvent({
      slug,
      date: String(form.get('date') || '').trim(),
      title: { el: String(form.get('title_el') || ''), de: String(form.get('title_de') || '') },
      excerpt: { el: String(form.get('excerpt_el') || ''), de: String(form.get('excerpt_de') || '') },
      image: String(form.get('image') || ''),
      imageVariants: { webp: [], jpg: [] },
      content: { el: String(form.get('content_el') || ''), de: String(form.get('content_de') || '') },
      mediaBlocks: JSON.parse(String(form.get('media_blocks') || '[]'))
    });

    throw redirect(303, '/admin/events');
  }
};
