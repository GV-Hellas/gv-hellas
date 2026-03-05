import { getGallery } from '$lib/cms';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
  const items = await getGallery({ fetch });
  return { items };
}
