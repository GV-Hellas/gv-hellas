import { error, fail, redirect } from '@sveltejs/kit';
import { getEquipmentById, upsertEquipment } from '$lib/server/cms-store';
import { processImageUpload, storeVideoUpload } from '$lib/server/media';

export async function load({ params }) {
  const item = getEquipmentById(Number(params.id));
  if (!item) throw error(404, 'Equipment not found');
  return { item };
}

export const actions = {
  save: async ({ request, params }) => {
    const existing = getEquipmentById(Number(params.id));
    if (!existing) throw error(404, 'Equipment not found');

    const form = await request.formData();
    const name = String(form.get('name') || '').trim();
    if (!name) return fail(400, { error: 'Equipment model name is required.' });

    const images = [...existing.images];
    for (const [index, key] of ['image1', 'image2', 'image3'].entries()) {
      const file = form.get(key);
      if (file instanceof File && file.size > 0) {
        const processed = await processImageUpload(file, `equipment-${key}`);
        images[index] = { src: processed?.original || '', variants: { webp: processed?.webp?.[0]?.src || '', jpg: processed?.jpg?.[0]?.src || '' } };
      }
    }

    const videoFile = form.get('video');
    const video = videoFile instanceof File && videoFile.size > 0 ? await storeVideoUpload(videoFile, 'equipment-video') : existing.video;

    upsertEquipment({
      id: existing.id,
      name,
      brand: String(form.get('brand') || ''),
      modelYear: String(form.get('model_year') || ''),
      description: String(form.get('description') || ''),
      pricePerDay: Number(form.get('price_per_day') || 0),
      images,
      video
    });

    throw redirect(303, '/admin/equipment');
  }
};
