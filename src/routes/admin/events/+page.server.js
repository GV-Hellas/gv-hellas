import { redirect } from '@sveltejs/kit';
import { deleteEvent, listEvents } from '$lib/server/cms-store';

export async function load() {
  return { events: listEvents() };
}

export const actions = {
  delete: async ({ request }) => {
    const form = await request.formData();
    const slug = String(form.get('slug') || '');
    if (slug) deleteEvent(slug);
    throw redirect(303, '/admin/events');
  }
};
