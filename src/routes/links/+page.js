import { getUsefulLinks } from '$lib/cms';

/** @type {import('./$types').PageLoad} */
export async function load() {
  const links = await getUsefulLinks();
  return { links };
}