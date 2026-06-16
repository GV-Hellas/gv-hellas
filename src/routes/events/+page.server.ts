import {listEvents} from '$lib/server/cms/eventsStore';

function eventTimestamp(event: {date?: string; time?: string}) {
    const date = event.date || '';
    const time = event.time || '00:00';

    const timestamp = new Date(`${date}T${time}`).getTime();

    return Number.isFinite(timestamp) ? timestamp : 0;
}

export const load = async () => {
    const events = await listEvents();
    const now = Date.now();

    const upcoming = events
        .filter((event) => eventTimestamp(event) >= now)
        .sort((a, b) => eventTimestamp(a) - eventTimestamp(b));

    const past = events
        .filter((event) => eventTimestamp(event) < now)
        .sort((a, b) => eventTimestamp(b) - eventTimestamp(a));

    return {
        upcoming,
        past
    };
};