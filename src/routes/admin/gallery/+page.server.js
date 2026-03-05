import { redirect } from '@sveltejs/kit';
import { deleteGallery, listGallery } from '$lib/server/cms-store';

export async function load() {
  return { items: listGallery() };
}

export const actions = {
  delete: async ({ request }) => {
    const form = await request.formData();
    const id = String(form.get('id') || '');
    if (id) deleteGallery(id);
    throw redirect(303, '/admin/gallery');
  }
};
