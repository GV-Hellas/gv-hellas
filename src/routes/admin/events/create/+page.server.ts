import {fail} from '@sveltejs/kit';
import type {Actions} from '@sveltejs/kit';

import type {EventPayload} from '$lib/cms/events/types';
import {eventPayloadSchema} from '$lib/cms/events/schema';
import {sanitizeEventHtml} from '$lib/server/html/sanitizeEventHtml';
import {saveEvent} from '$lib/server/cms/eventsStore';
import {saveEventMedia} from '$lib/server/cms/mediaStore';
import {slugify} from '$lib/utils';
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

function parsePrice(value: unknown) {
    if (value === '' || value === undefined || value === null) return null;

    const n = Number(value);

    return Number.isFinite(n) ? n : null;
}

function actionError(status: number, message: string) {
    return fail(status, {
        ok: false,
        message
    } satisfies ActionResponse);
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

async function attachProcessedMedia(event: EventPayload, formData: FormData, slug: string) {
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

export const actions: Actions = {
    create: async ({request}) => {
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

        const source = parsedJson as Record<string, unknown>;

        const normalized = {
            ...source,
            priceMembers: parsePrice(source.priceMembers),
            pricePublic: parsePrice(source.pricePublic)
        };

        const result = eventPayloadSchema.safeParse(normalized);

        if (!result.success) {
            return actionError(400, result.error.issues[0]?.message || 'Invalid event data');
        }

        const event = sanitizeEvent(result.data as EventPayload);
        const slug = slugify(event.title.el || event.title.de);

        if (!slug) {
            return actionError(400, 'Could not infer slug from title');
        }

        await translateEventPayloadMissingGerman(event);
        sanitizeEvent(event);

        try {
            await attachProcessedMedia(event, formData, slug);
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