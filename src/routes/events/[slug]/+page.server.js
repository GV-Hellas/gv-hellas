import { getEvent } from '$lib/cms';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, fetch }) {
  const event = await getEvent(params.slug, { fetch });
  if (!event) {
    return { status: 404, error: new Error('Event not found') };
  }

  return { event };
}
