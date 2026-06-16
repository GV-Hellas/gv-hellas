import {fail} from '@sveltejs/kit';
import type {Actions} from '@sveltejs/kit';

import {slugify} from '$lib/utils';
import {businessPayloadSchema} from '$lib/cms/business/validation';
import {saveBusiness} from '$lib/server/cms/businessStore';
import {saveBusinessMedia} from '$lib/server/cms/businessMediaStore';
import {sanitizeEventHtml} from '$lib/server/html/sanitizeEventHtml';
import type {BusinessPayload} from '$lib/cms/business/types';
import {
    prepareUploadedImageFile,
    prepareUploadedMediaFile,
    translateBusinessPayloadMissingGerman
} from '$lib/server/mediaProcessing';

type ActionResponse = {
    ok: boolean;
    id?: number;
    slug?: string;
    message?: string;
};

function actionError(status: number, message: string) {
    return fail(status, {
        ok: false,
        message
    } satisfies ActionResponse);
}

function sanitizeBusiness(business: BusinessPayload) {
    business.description.el = sanitizeEventHtml(business.description.el);
    business.description.de = sanitizeEventHtml(business.description.de);

    for (const section of business.sections) {
        section.beforeHtml.el = sanitizeEventHtml(section.beforeHtml.el);
        section.beforeHtml.de = sanitizeEventHtml(section.beforeHtml.de);
        section.afterHtml.el = sanitizeEventHtml(section.afterHtml.el);
        section.afterHtml.de = sanitizeEventHtml(section.afterHtml.de);
    }

    return business;
}

async function attachProcessedBusinessMedia(business: BusinessPayload, formData: FormData, slug: string) {
    const logo = formData.get('logo');

    if (logo instanceof File && logo.size > 0) {
        const processedLogo = await prepareUploadedImageFile(logo);
        const savedLogo = await saveBusinessMedia(processedLogo.file, slug);

        business.logo = savedLogo.url;
    }

    for (const section of business.sections) {
        for (const media of section.media) {
            if (!media.uploadKey) continue;

            const file = formData.get(media.uploadKey);

            if (file instanceof File && file.size > 0) {
                const processed = await prepareUploadedMediaFile(file);
                const saved = await saveBusinessMedia(processed.file, slug);

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
    save: async ({request}) => {
        const formData = await request.formData();
        const rawPayload = formData.get('payload');

        if (typeof rawPayload !== 'string') {
            return actionError(400, 'Missing business payload');
        }

        let parsedJson: unknown;

        try {
            parsedJson = JSON.parse(rawPayload);
        } catch {
            return actionError(400, 'Invalid business payload');
        }

        const source = parsedJson && typeof parsedJson === 'object' ? (parsedJson as Record<string, unknown>) : {};
        const slug = slugify(String(source.name || ''));

        if (!slug) {
            return actionError(400, 'Could not infer slug from business name');
        }

        const result = businessPayloadSchema.safeParse({
            ...source,
            slug
        });

        if (!result.success) {
            return actionError(400, result.error.issues[0]?.message || 'Invalid business data');
        }

        const business: BusinessPayload = sanitizeBusiness(result.data);
        business.slug = slug;

        await translateBusinessPayloadMissingGerman(business);
        sanitizeBusiness(business);

        try {
            await attachProcessedBusinessMedia(business, formData, slug);
        } catch (error) {
            return actionError(
                400,
                error instanceof Error ? error.message : 'Could not process uploaded business media'
            );
        }

        const stored = await saveBusiness(business);

        return {
            ok: true,
            id: stored.id,
            slug: stored.slug,
            message: 'Business saved successfully'
        } satisfies ActionResponse;
    }
};