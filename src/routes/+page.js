import { getEvents, getGallery } from '$lib/cms';

/** @type {import('./$types').PageLoad} */
export async function load() {
  const events = await getEvents();
  const gallery = await getGallery();
  // Only show the first three events on the home page
  const latestEvents = events.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
  return { events: latestEvents, gallery };
}