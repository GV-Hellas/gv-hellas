import {error, json} from '@sveltejs/kit';
import type {RequestEvent} from '@sveltejs/kit';

import type {EventPayload, EventSection} from '$lib/cms/events/types';
import {EVENT_CATEGORIES, eventPayloadSchema} from '$lib/cms/events/schema';
import {sanitizeEventHtml} from '$lib/server/html/sanitizeEventHtml';
import {getEventBySlug, saveEvent} from '$lib/server/cms/eventsStore';
import {saveEventMedia} from '$lib/server/cms/mediaStore';

type Actions = {
    save: (event: RequestEvent) => Promise<Response>;
};

function localizedText(value: unknown) {
    if (!value || typeof value !== 'object') {
        return {el: '', de: ''};
    }

    const record = value as Partial<Record<'el' | 'de', unknown>>;

    return {
        el: typeof record.el === 'string' ? record.el : '',
        de: typeof record.de === 'string' ? record.de : ''
    };
}

function parsePrice(value: unknown) {
    if (value === '' || value === undefined) return null;
    if (value === null) return null;

    const n = Number(value);

    return Number.isFinite(n) ? n : null;
}

function emptySection(): EventSection {
    return {
        id: crypto.randomUUID(),
        beforeHtml: {el: '', de: ''},
        media: [],
        afterHtml: {el: '', de: ''}
    };
}

function normalizeEventForForm(raw: unknown): EventPayload {
    const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

    const sections =
        Array.isArray(source.sections) && source.sections.length > 0
            ? source.sections
            : [emptySection()];

    const category =
        typeof source.category === 'string' && EVENT_CATEGORIES.includes(source.category as never)
            ? source.category
            : 'general';

    return {
        title: localizedText(source.title),
        description: localizedText(source.description ?? source.excerpt),
        date: typeof source.date === 'string' ? source.date : '',
        time: typeof source.time === 'string' ? source.time : '',
        location: typeof source.location === 'string' ? source.location : '',
        category,
        priceMembers: parsePrice(source.priceMembers),
        pricePublic: parsePrice(source.pricePublic),
        sections: sections as EventSection[]
    };
}

function sanitizeAndAttachMedia(event: EventPayload, formData: FormData, slug: string) {
    return Promise.all(
        event.sections.map(async (section) => {
            section.beforeHtml.el = sanitizeEventHtml(section.beforeHtml.el);
            section.beforeHtml.de = sanitizeEventHtml(section.beforeHtml.de);
            section.afterHtml.el = sanitizeEventHtml(section.afterHtml.el);
            section.afterHtml.de = sanitizeEventHtml(section.afterHtml.de);

            for (const media of section.media) {
                if (!media.uploadKey) continue;

                const file = formData.get(media.uploadKey);

                if (file instanceof File && file.size > 0) {
                    const saved = await saveEventMedia(file, slug);

                    media.url = saved.url;
                    media.filename = saved.filename;
                    media.mimeType = saved.mimeType;
                }

                delete media.uploadKey;
            }
        })
    );
}

async function getEventFromRouteSlug(routeSlug: string) {
    console.log('routeSlug', routeSlug);
    return (
        await getEventBySlug(routeSlug) ??
        await getEventBySlug(encodeURIComponent(routeSlug))
    );
}

export const load: ({params}: { params: { slug: string } }) => Promise<{ event: EventPayload }> = async ({params}: { params: { slug: string } }) => {
    const existing = await getEventFromRouteSlug(params.slug);

    if (!existing) {
        throw error(404, 'Event not found');
    }

    return {
        event: normalizeEventForForm(existing)
    };
};

export const actions: Actions = {
    save: async ({request, params}) => {
        const existing = await getEventFromRouteSlug(params.slug);

        if (!existing) {
            return json(
                {
                    ok: false,
                    message: 'Event not found'
                },
                {status: 404}
            );
        }

        const slug = existing.slug;
        const formData = await request.formData();
        const rawPayload = formData.get('payload');

        if (typeof rawPayload !== 'string') {
            return json(
                {
                    ok: false,
                    message: 'Missing event payload'
                },
                {status: 400}
            );
        }

        let parsedJson: unknown;

        try {
            parsedJson = JSON.parse(rawPayload);
        } catch {
            return json(
                {
                    ok: false,
                    message: 'Invalid event payload'
                },
                {status: 400}
            );
        }

        const normalized = {
            ...(parsedJson as Record<string, unknown>),
            priceMembers: parsePrice((parsedJson as Record<string, unknown>).priceMembers),
            pricePublic: parsePrice((parsedJson as Record<string, unknown>).pricePublic)
        };

        const result = eventPayloadSchema.safeParse(normalized);

        if (!result.success) {
            return json(
                {
                    ok: false,
                    message: result.error.issues[0]?.message || 'Invalid event data'
                },
                {status: 400}
            );
        }

        const event = result.data;

        await sanitizeAndAttachMedia(event, formData, slug);

        const stored = await saveEvent(event, slug);

        return json({
            ok: true,
            id: stored.id,
            slug: stored.slug
        });
    }
};