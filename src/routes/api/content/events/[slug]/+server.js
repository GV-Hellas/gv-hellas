import { json } from '@sveltejs/kit';
import { readCMS } from '$lib/server/cms-store';

export async function GET({ params }) {
  const cms = await readCMS();
  const event = (cms.events ?? []).find((e) => e.slug === params.slug) || null;
  return json(event);
}
