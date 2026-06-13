import { getGallery } from '$lib/cms';

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
  const items = await getGallery({ fetch });
  return { items };
}
