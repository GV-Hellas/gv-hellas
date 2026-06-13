import { getBusinesses } from '$lib/cms';

/** @type {import('./$types').PageLoad} */
export async function load() {
  const businesses = await getBusinesses();
  return { businesses };
}