import {error, fail} from '@sveltejs/kit';
import type {Actions} from '@sveltejs/kit';

import type {EventPayload, EventSection} from '$lib/cms/events/types';
import {EVENT_CATEGORIES, eventPayloadSchema} from '$lib/cms/events/schema';
import {sanitizeEventHtml} from '$lib/server/html/sanitizeEventHtml';
import {getEventBySlug, saveEvent} from '$lib/server/cms/eventsStore';
import {saveEventMedia} from '$lib/server/cms/mediaStore';
import {
    prepareUploadedMediaFile,
    translateEventPayloadMissingGerman
} from '$lib/server/mediaProcessing';

type ActionResponse = {
    ok: boolean;
    id?: string;
    slug?: string;
    message?: string;
};

function localizedText(value: unknown) {
    if (!value || typeof value !== 'object') return {el: '', de: ''};

    const record = value as Partial<Record<'el' | 'de', unknown>>;

    return {
        el: typeof record.el === 'string' ? record.el : '',
        de: typeof record.de === 'string' ? record.de : ''
    };
}

function parsePrice(value: unknown) {
    if (value === '' || value === undefined || value === null) return null;

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

function isEventCategory(value: unknown): value is EventPayload['category'] {
    return typeof value === 'string' && (EVENT_CATEGORIES as readonly string[]).includes(value);
}

function normalizeCategory(value: unknown): EventPayload['category'] {
    return isEventCategory(value) ? value : 'general';
}

function normalizeEventForForm(raw: unknown): EventPayload {
    const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

    const sections =
        Array.isArray(source.sections) && source.sections.length > 0
            ? source.sections
            : [emptySection()];

    return {
        title: localizedText(source.title),
        description: localizedText(source.description ?? source.excerpt),
        date: typeof source.date === 'string' ? source.date : '',
        time: typeof source.time === 'string' ? source.time : '',
        location: typeof source.location === 'string' ? source.location : '',
        category: normalizeCategory(source.category),
        priceMembers: parsePrice(source.priceMembers),
        pricePublic: parsePrice(source.pricePublic),
        sections: sections as EventSection[]
    };
}

function normalizeIncomingPayload(parsedJson: unknown) {
    const source = parsedJson && typeof parsedJson === 'object' ? (parsedJson as Record<string, unknown>) : {};

    return {
        ...source,
        category: normalizeCategory(source.category),
        priceMembers: parsePrice(source.priceMembers),
        pricePublic: parsePrice(source.pricePublic)
    };
}

function sanitizeEvent(event: EventPayload) {
    for (const section of event.sections) {
        section.beforeHtml.el = sanitizeEventHtml(section.beforeHtml.el);
        section.beforeHtml.de = sanitizeEventHtml(section.beforeHtml.de);
        section.afterHtml.el = sanitizeEventHtml(section.afterHtml.el);
        section.afterHtml.de = sanitizeEventHtml(section.afterHtml.de);
    }

    return event;
}

async function sanitizeTranslateAndAttachMedia(event: EventPayload, formData: FormData, slug: string) {
    sanitizeEvent(event);
    await translateEventPayloadMissingGerman(event);
    sanitizeEvent(event);

    for (const section of event.sections) {
        for (const media of section.media) {
            if (!media.uploadKey) continue;

            const file = formData.get(media.uploadKey);

            if (file instanceof File && file.size > 0) {
                const processed = await prepareUploadedMediaFile(file);
                const saved = await saveEventMedia(processed.file, slug);

                media.type = processed.kind;
                media.url = saved.url;
                media.filename = saved.filename;
                media.originalFilename = file.name;
                media.mimeType = saved.mimeType;
                media.size = saved.size;
            }

            delete media.uploadKey;
        }
    }
}

async function getEventFromRouteSlug(routeSlug: string) {
    return (
        (await getEventBySlug(routeSlug)) ??
        (await getEventBySlug(decodeURIComponent(routeSlug))) ??
        (await getEventBySlug(encodeURIComponent(routeSlug)))
    );
}

function actionError(status: number, message: string) {
    return fail(status, {
        ok: false,
        message
    } satisfies ActionResponse);
}

export const load = async ({params}: {params: {slug: string}}) => {
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
            return actionError(404, 'Event not found');
        }

        const slug = existing.slug;
        const formData = await request.formData();
        const rawPayload = formData.get('payload');

        if (typeof rawPayload !== 'string') {
            return actionError(400, 'Missing event payload');
        }

        let parsedJson: unknown;

        try {
            parsedJson = JSON.parse(rawPayload);
        } catch {
            return actionError(400, 'Invalid event payload');
        }

        const normalized = normalizeIncomingPayload(parsedJson);
        const result = eventPayloadSchema.safeParse(normalized);

        if (!result.success) {
            return actionError(400, result.error.issues[0]?.message || 'Invalid event data');
        }

        const event = result.data as EventPayload;

        try {
            await sanitizeTranslateAndAttachMedia(event, formData, slug);
        } catch (error) {
            return actionError(
                400,
                error instanceof Error ? error.message : 'Could not process uploaded media'
            );
        }

        const stored = await saveEvent(event, slug);

        return {
            ok: true,
            id: stored.id,
            slug: stored.slug,
            message: 'Event saved successfully'
        } satisfies ActionResponse;
    }
};