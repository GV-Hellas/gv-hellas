import { json } from '@sveltejs/kit';
import { listEvents } from '$lib/server/cms-store';

export async function GET() {
  return json(listEvents());
}
