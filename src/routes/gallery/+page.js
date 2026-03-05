import { getGallery } from '$lib/cms';

/** @type {import('./$types').PageLoad} */
export async function load() {
  const items = await getGallery();
  return { items };
}