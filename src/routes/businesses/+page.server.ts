import {listBusinesses} from '$lib/server/cms/businessStore';

export const load = async () => {
    return {
        businesses: listBusinesses()
    };
};