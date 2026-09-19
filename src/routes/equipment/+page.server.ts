import type {PageServerLoad} from './$types';
import {listEquipment} from '$lib/server/cms/equipmentStore';

export const load: PageServerLoad = async ({setHeaders}) => {
    setHeaders({'cache-control': 'no-store'});

    return {
        equipment: await listEquipment()
    };
};
