import { getEvent } from '$lib/cms';

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
  const event = await getEvent(params.slug);
  if (!event) {
    return { status: 404, error: new Error('Event not found') };
  }
  return { event };
}