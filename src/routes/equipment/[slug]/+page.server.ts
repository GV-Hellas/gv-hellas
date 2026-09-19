import {error} from '@sveltejs/kit';
import type {PageServerLoad} from './$types';
import {getEquipmentBySlug} from '$lib/server/cms/equipmentStore';

export const load: PageServerLoad = async ({params, setHeaders}) => {
    setHeaders({'cache-control': 'no-store'});

    const item = await getEquipmentBySlug(params.slug);

    if (!item) {
        throw error(404, 'Equipment not found');
    }

    return {item};
};
