import {error, json} from '@sveltejs/kit';
import type {RequestHandler} from './$types';
import {getEquipmentBySlug} from '$lib/server/cms/equipmentStore';

export const GET: RequestHandler = async ({params}) => {
    const item = await getEquipmentBySlug(params.slug);

    if (!item) {
        throw error(404, 'Equipment not found');
    }

    return json(item);
};
