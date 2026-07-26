import type {PageServerLoad} from './$types';

import {listEquipment} from '$lib/server/cms-store';

export const load: PageServerLoad = async () => {
    return {
        equipment: await listEquipment()
    };
};
