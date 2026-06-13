import {listEvents} from '$lib/server/cms/eventsStore';

export const load = async () => {
    const events = await listEvents();

    return {
        events
    };
};