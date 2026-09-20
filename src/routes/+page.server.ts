import {listEvents} from '$lib/server/cms/eventsStore';
import {listBusinesses} from '$lib/server/cms/businessStore';
import {listHomepageSlides} from '$lib/server/cms/homepageStore';
import {
    compareEventsNewestFirst,
    compareEventsSoonestFirst,
    isEventActive,
    isEventUpcoming,
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

    // Keep the homepage event list semantically ordered as well:
    // upcoming from nearest to furthest, then past from newest to oldest.
    const upcomingEvents = events
        .filter((event) => isEventUpcoming(event, nowKey))
        .sort(compareEventsSoonestFirst);

    const pastEvents = events
        .filter((event) => event.date && !isEventUpcoming(event, nowKey))
        .sort(compareEventsNewestFirst);

    const recentEvents = [...upcomingEvents, ...pastEvents].slice(0, 3);

    const mainSponsor = businesses.find((business) => business.sponsorType === 'main') ?? null;
    const sponsors = businesses.filter((business) => business.sponsorType === 'sponsor');

    return {
        activeEvent,
        events: recentEvents,
        mainSponsor,
        sponsors,
        heroSlides
    };
};
