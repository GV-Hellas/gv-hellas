import { json } from '@sveltejs/kit';
import { readCMS } from '$lib/server/cms-store';

export async function GET() {
  const cms = await readCMS();
  return json(cms.gallery ?? []);
}
