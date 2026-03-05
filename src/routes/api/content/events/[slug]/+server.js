import { json } from '@sveltejs/kit';
import { getEventBySlug } from '$lib/server/cms-store';

export async function GET({ params }) {
  return json(getEventBySlug(params.slug));
}
