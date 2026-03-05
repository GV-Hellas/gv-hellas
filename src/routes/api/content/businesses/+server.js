import { json } from '@sveltejs/kit';
import { listBusinesses } from '$lib/server/cms-store';

export async function GET() {
  return json(listBusinesses());
}
