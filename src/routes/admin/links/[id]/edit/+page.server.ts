import {error, fail} from '@sveltejs/kit';
import type {Actions, ServerLoad} from '@sveltejs/kit';

import {linkPayloadSchema} from '$lib/cms/links/schema';
import {getLinkById, upsertLink} from '$lib/server/cms/linkStore';
import {processImageUpload} from '$lib/server/media';
import {sanitizeEventHtml} from '$lib/server/html/sanitizeEventHtml';

type ActionResponse = {
    ok: boolean;
    id?: number;
    message?: string;
};

function actionError(status: number, message: string) {
    return fail(status, {
        ok: false,
        message
    } satisfies ActionResponse);
}

function fallbackPayload(form: FormData) {
    return {
        name: {
            el: String(form.get('name_el') || ''),
            de: String(form.get('name_de') || '')
        },
        descriptionHtml: {
            el: String(form.get('description_html_el') || ''),
            de: String(form.get('description_html_de') || '')
        },
        url: String(form.get('url') || ''),
        logo: '',
        logoVariants: {
            webp: '',
            jpg: ''
        }
    };
}

function parsePayload(form: FormData) {
    const rawPayload = form.get('payload');

    if (typeof rawPayload === 'string' && rawPayload.trim()) {
        try {
            return JSON.parse(rawPayload);
        } catch {
            return fallbackPayload(form);
        }
    }

    return fallbackPayload(form);
}

export const load: ServerLoad = async ({params}) => {
    const item = getLinkById(Number(params.id));

    if (!item) {
        throw error(404, 'Link not found');
    }

    return {
        item
    };
};

export const actions: Actions = {
    save: async ({request, params}) => {
        const existing = getLinkById(Number(params.id));

        if (!existing) {
            return actionError(404, 'Link not found');
        }

        const form = await request.formData();
        const parsedPayload = parsePayload(form);

        const result = linkPayloadSchema.safeParse(parsedPayload);

        if (!result.success) {
            return actionError(
                400,
                result.error.issues[0]?.message || 'Invalid link data'
            );
        }

        const payload = result.data;

        payload.descriptionHtml.el = sanitizeEventHtml(payload.descriptionHtml.el);
        payload.descriptionHtml.de = sanitizeEventHtml(payload.descriptionHtml.de);

        const upload = form.get('logo');
        const processed =
            upload instanceof File && upload.size > 0
                ? await processImageUpload(upload, 'link-logo')
                : null;

        const stored = upsertLink({
            id: existing.id,
            ...payload,
            logo: processed?.original || existing.logo || payload.logo || '',
            logoVariants: {
                webp:
                    processed?.webp?.[0]?.src ||
                    existing.logoVariants?.webp ||
                    payload.logoVariants?.webp ||
                    '',
                jpg:
                    processed?.jpg?.[0]?.src ||
                    existing.logoVariants?.jpg ||
                    payload.logoVariants?.jpg ||
                    ''
            }
        });

        return {
            ok: true,
            id: stored.id,
            message: 'Link saved successfully'
        } satisfies ActionResponse;
    }
};