import {listBusinesses} from '$lib/server/cms/businessStore';

export const load = async () => {
    const businesses = await listBusinesses();

    return {
        businesses
    };
};