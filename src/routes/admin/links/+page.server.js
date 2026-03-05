import { redirect } from '@sveltejs/kit';
import { deleteLink, listLinks } from '$lib/server/cms-store';

export async function load() {
  return { links: listLinks() };
}

export const actions = {
  delete: async ({ request }) => {
    const form = await request.formData();
    const id = Number(form.get('id') || 0);
    if (id) deleteLink(id);
    throw redirect(303, '/admin/links');
  }
};
