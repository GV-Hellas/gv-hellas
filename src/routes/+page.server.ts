import {listEvents} from '$lib/server/cms/eventsStore';

export const load = async () => {
    const events = await listEvents();

    return {
        events: events
            .filter((event) => event.date)
            .sort((a, b) => {
                const dateA = `${a.date || ''} ${a.time || ''}`;
                const dateB = `${b.date || ''} ${b.time || ''}`;

                return dateA.localeCompare(dateB);
            })
            .slice(0, 3)
    };
};