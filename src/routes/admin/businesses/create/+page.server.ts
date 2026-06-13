import {type Actions, json} from '@sveltejs/kit';

import {slugify} from '$lib/utils';
import {businessPayloadSchema} from '$lib/cms/business/validation';
import {saveBusiness} from '$lib/server/cms/businessStore';
import {saveBusinessMedia} from '$lib/server/cms/businessMediaStore';
import {sanitizeEventHtml} from '$lib/server/html/sanitizeEventHtml';
import type {BusinessPayload} from "$lib/cms/business/types";

function normalizeSlug(value: string, fallback: string) {
    return (value || slugify(fallback)).trim();
}

export const actions: Actions = {
    save: async ({request}: { request: Request }) => {
        const formData = await request.formData();
        const rawPayload = formData.get('payload');

        if (typeof rawPayload !== 'string') {
            return json(
                {
                    ok: false,
                    message: 'Missing business payload'
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
                    message: 'Invalid business payload'
                },
                {status: 400}
            );
        }

        const result = businessPayloadSchema.safeParse(parsedJson);

        if (!result.success) {
            return json(
                {
                    ok: false,
                    message: result.error.issues[0]?.message || 'Invalid business data'
                },
                {status: 400}
            );
        }

        const business: BusinessPayload = result.data;

        const slug = slugify(business.name).trim();
        if (!slug) {
            return json(
                {
                    ok: false,
                    message: 'Could not infer slug from business name'
                },
                {status: 400}
            );
        }
        business.slug = slug;

        business.description.el = sanitizeEventHtml(business.description.el);
        business.description.de = sanitizeEventHtml(business.description.de);

        const logo = formData.get('logo');

        if (logo instanceof File && logo.size > 0) {
            const savedLogo = await saveBusinessMedia(logo, slug);
            business.logo = savedLogo.url;
        }

        for (const section of business.sections) {
            section.beforeHtml.el = sanitizeEventHtml(section.beforeHtml.el);
            section.beforeHtml.de = sanitizeEventHtml(section.beforeHtml.de);
            section.afterHtml.el = sanitizeEventHtml(section.afterHtml.el);
            section.afterHtml.de = sanitizeEventHtml(section.afterHtml.de);

            for (const media of section.media) {
                if (!media.uploadKey) continue;

                const file = formData.get(media.uploadKey);

                if (file instanceof File && file.size > 0) {
                    const saved = await saveBusinessMedia(file, slug);

                    media.url = saved.url;
                    media.filename = saved.filename;
                    media.originalFilename = saved.originalFilename;
                    media.mimeType = saved.mimeType;
                    media.size = saved.size;
                }

                delete media.uploadKey;
            }
        }

        const stored = saveBusiness(business);

        return json({
            ok: true,
            id: stored.id,
            slug: stored.slug
        });
    }
};