import {listEvents} from '$lib/server/cms/eventsStore';
import {listBusinesses} from '$lib/server/cms/businessStore';
import {listHomepageSlides} from '$lib/server/cms/homepageStore';
import {
    compareEventsNewestFirst,
    compareEventsSoonestFirst,
    isEventActive,
    zurichNowKey
} from '$lib/cms/events/time';

export const load = async () => {
    const [events, businesses, heroSlides] = await Promise.all([
        listEvents(),
        listBusinesses(),
        listHomepageSlides().catch((error) => {
            console.error('Loading homepage slides failed; using static fallback slides.', error);
            return [];
        })
    ]);

    const nowKey = zurichNowKey();
    const activeEvent = events
        .filter((event) => isEventActive(event, nowKey))
        .sort(compareEventsSoonestFirst)[0] ?? null;

    const recentEvents = [...events]
        .filter((event) => event.date)
        .sort(compareEventsNewestFirst)
        .slice(0, 3);

    const sponsors = businesses.filter((business) => business.sponsorType !== 'listed');

    return {
        activeEvent,
        events: recentEvents,
        sponsors,
        heroSlides
    };
};
