import {listEvents} from '$lib/server/cms/eventsStore';
import {
    compareEventsNewestFirst,
    compareEventsSoonestFirst,
    isEventUpcoming,
    zurichNowKey
} from '$lib/cms/events/time';

export const load = async () => {
    const events = await listEvents();
    const nowKey = zurichNowKey();

    const upcoming = events
        .filter((event) => isEventUpcoming(event, nowKey))
        .sort(compareEventsSoonestFirst);

    const past = events
        .filter((event) => !isEventUpcoming(event, nowKey))
        .sort(compareEventsNewestFirst);

    return {
        upcoming,
        past
    };
};
