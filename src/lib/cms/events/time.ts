import type {EventPayload} from './types';

type EventTiming = Pick<EventPayload, 'date' | 'time' | 'endTime'>;

function pad(value: string) {
    return value.padStart(2, '0');
}

export function eventStartKey(event: EventTiming) {
    if (!event.date) return '';
    return `${event.date}T${event.time || '00:00'}`;
}

export function eventEndKey(event: EventTiming) {
    if (!event.date) return '';
    return `${event.date}T${event.endTime || event.time || '00:00'}`;
}

export function zurichNowKey(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Zurich',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    }).formatToParts(now);

    const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));

    return `${map.year}-${pad(map.month)}-${pad(map.day)}T${pad(map.hour)}:${pad(map.minute)}`;
}

/**
 * Homepage "active" means an announced event that is still in the future.
 * Date-only events remain active for their whole calendar date.
 */
export function isEventActive(event: EventTiming, nowKey = zurichNowKey()) {
    if (!event.date) return false;

    if (!event.time) {
        return event.date >= nowKey.slice(0, 10);
    }

    return eventStartKey(event) >= nowKey;
}

/**
 * The events index keeps an event in the upcoming group until it has ended.
 * When no explicit end time exists, the start time is the cut-off.
 */
export function isEventUpcoming(event: EventTiming, nowKey = zurichNowKey()) {
    if (!event.date) return false;

    if (!event.time) {
        return event.date >= nowKey.slice(0, 10);
    }

    const end = eventEndKey(event);
    return Boolean(end && end >= nowKey);
}

export function compareEventsNewestFirst(a: EventTiming, b: EventTiming) {
    return eventStartKey(b).localeCompare(eventStartKey(a));
}

export function compareEventsSoonestFirst(a: EventTiming, b: EventTiming) {
    return eventStartKey(a).localeCompare(eventStartKey(b));
}
