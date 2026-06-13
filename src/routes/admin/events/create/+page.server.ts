import {json} from '@sveltejs/kit';
import type {RequestEvent} from '@sveltejs/kit';
import {eventPayloadSchema} from '$lib/cms/events/schema';
import {sanitizeEventHtml} from '$lib/server/html/sanitizeEventHtml';
import {saveEvent} from '$lib/server/cms/eventsStore';
import {saveEventMedia} from '$lib/server/cms/mediaStore';
import {slugify} from '$lib/utils';

type Actions = {
    create: (event: RequestEvent) => Promise<Response>;
};

function parsePrice(value: unknown) {
    if (value === '' || value === undefined) return null;
    if (value === null) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

export const actions: Actions = {
    create: async ({request}: { request: Request }) => {
        const formData = await request.formData();
        const rawPayload = formData.get('payload');

        if (typeof rawPayload !== 'string') {
            return json({ok: false, message: 'Missing event payload'}, {status: 400});
        }

        const parsedJson = JSON.parse(rawPayload);

        const normalized = {
            ...parsedJson,
            priceMembers: parsePrice(parsedJson.priceMembers),
            pricePublic: parsePrice(parsedJson.pricePublic)
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
        const slug = slugify(event.title.el || event.title.de);

        if (!slug) {
            return json({ok: false, message: 'Could not infer slug from title'}, {status: 400});
        }

        for (const section of event.sections) {
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
        }

        const stored = await saveEvent(event, slug);

        return json({
            ok: true,
            id: stored.id,
            slug: stored.slug
        });
    }
};