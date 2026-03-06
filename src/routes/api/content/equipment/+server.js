import { json } from '@sveltejs/kit';
import { listEquipment } from '$lib/server/cms-store';

export async function GET() {
  return json(listEquipment());
}
