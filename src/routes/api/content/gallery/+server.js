import { json } from '@sveltejs/kit';
import { listGallery } from '$lib/server/cms-store';

export async function GET() {
  return json(listGallery());
}
