import { fail, redirect } from '@sveltejs/kit';
import { upsertEquipment } from '$lib/server/cms-store';
import { processImageUpload, storeVideoUpload } from '$lib/server/media';

export const actions = {
  save: async ({ request }) => {
    const form = await request.formData();
    const name = String(form.get('name') || '').trim();
    if (!name) return fail(400, { error: 'Equipment model name is required.' });

    const images = [];
    for (const key of ['image1', 'image2', 'image3']) {
      const file = form.get(key);
      if (file instanceof File && file.size > 0) {
        const processed = await processImageUpload(file, `equipment-${key}`);
        if (processed) images.push({ src: processed.original, variants: { webp: processed.webp?.[0]?.src || '', jpg: processed.jpg?.[0]?.src || '' } });
      }
    }

    const videoFile = form.get('video');
    const video = videoFile instanceof File && videoFile.size > 0 ? await storeVideoUpload(videoFile, 'equipment-video') : '';

    upsertEquipment({
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
