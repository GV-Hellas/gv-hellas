import { getEvents } from '$lib/cms';

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
  const events = await getEvents({ fetch });
  const latestEvents = events.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);

  return { events: latestEvents };
}
