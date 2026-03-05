import { json } from '@sveltejs/kit';
import { listLinks } from '$lib/server/cms-store';

export async function GET() {
  return json(listLinks());
}
