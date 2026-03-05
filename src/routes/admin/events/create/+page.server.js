import { fail, redirect } from '@sveltejs/kit';
import { upsertEvent } from '$lib/server/cms-store';
import { processImageUpload } from '$lib/server/media';

export async function load() {
  return { event: null };
}

export const actions = {
  save: async ({ request }) => {
    const form = await request.formData();
    const slug = String(form.get('slug') || '').trim();
    if (!slug) return fail(400, { error: 'Slug required' });

    let blocks = [];
    try {
      blocks = JSON.parse(String(form.get('media_blocks') || '[]'));
    } catch {
      blocks = [];
    }

    const upload = form.get('image');
    const processed = upload instanceof File && upload.size > 0 ? await processImageUpload(upload, `event-${slug}`) : null;

    upsertEvent({
      slug,
      date: String(form.get('date') || '').trim(),
      title: { el: String(form.get('title_el') || ''), de: String(form.get('title_de') || '') },
      excerpt: { el: String(form.get('excerpt_el') || ''), de: String(form.get('excerpt_de') || '') },
      image: processed?.original || '',
      imageVariants: { webp: processed?.webp?.[0]?.src || '', jpg: processed?.jpg?.[0]?.src || '' },
      content: { el: String(form.get('content_el') || ''), de: String(form.get('content_de') || '') },
      mediaBlocks: blocks
    });

    throw redirect(303, '/admin/events');
  }
};
