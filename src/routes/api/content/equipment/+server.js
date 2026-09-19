import {json} from '@sveltejs/kit';
import {listEquipment} from '$lib/server/cms/equipmentStore';

export async function GET() {
    return json(await listEquipment());
}
