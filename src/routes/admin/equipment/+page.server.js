import { redirect } from '@sveltejs/kit';
import { deleteEquipment, listEquipment } from '$lib/server/cms-store';

export async function load() {
  return { equipment: listEquipment() };
}

export const actions = {
  delete: async ({ request }) => {
    const form = await request.formData();
    const id = Number(form.get('id') || 0);
    if (id) deleteEquipment(id);
    throw redirect(303, '/admin/equipment');
  }
};
