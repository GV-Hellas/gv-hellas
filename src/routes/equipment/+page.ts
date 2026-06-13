import { getEquipment } from '$lib/cms';

/** @type {import('./$types').PageLoad} */
export async function load() {
  const equipment = await getEquipment();
  return { equipment };
}
