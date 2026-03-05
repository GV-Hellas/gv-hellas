import { getEvents } from '$lib/cms';

/** @type {import('./$types').PageLoad} */
export async function load() {
  const events = await getEvents();
  // Split into upcoming and past based on date
  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = events.filter((e) => new Date(e.date) < now).sort((a, b) => new Date(b.date) - new Date(a.date));
  return { upcoming, past };
}