import {fail} from '@sveltejs/kit';
import type {Actions} from '@sveltejs/kit';

import {linkPayloadSchema} from '$lib/cms/links/schema';
import {upsertLink} from '$lib/server/cms/linkStore';
import {saveLinkLogo} from '$lib/server/cms/linkMediaStore';
import {sanitizeEventHtml} from '$lib/server/html/sanitizeEventHtml';

type ActionResponse = {
    ok: boolean;
    id?: number;
    errorKey?: string;
    message?: string;
};

function actionError(status: number, errorKey: string, message?: string) {
    return fail(status, {
        ok: false,
        errorKey,
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

export const actions: Actions = {
    save: async ({request}) => {
        const form = await request.formData();
        const parsedPayload = parsePayload(form);

        const result = linkPayloadSchema.safeParse(parsedPayload);

        if (!result.success) {
            return actionError(
                400,
                'admin.links.errors.invalidData',
                result.error.issues[0]?.message || undefined
            );
        }

        const payload = result.data;

        payload.descriptionHtml.el = sanitizeEventHtml(payload.descriptionHtml.el);
        payload.descriptionHtml.de = sanitizeEventHtml(payload.descriptionHtml.de);

        try {
            let stored = await upsertLink({
                ...payload,
                logo: '',
                logoVariants: {
                    webp: '',
                    jpg: ''
                }
            });

            const upload = form.get('logo');

            if (upload instanceof File && upload.size > 0) {
                const savedLogo = await saveLinkLogo(upload, stored.id);

                stored = await upsertLink({
                    id: stored.id,
                    ...payload,
                    logo: savedLogo.url,
                    logoVariants: {
                        webp: savedLogo.url,
                        jpg: ''
                    }
                });
            }

            return {
                ok: true,
                id: stored.id
            } satisfies ActionResponse;
        } catch (error) {
            return actionError(
                500,
                'admin.links.errors.saveFailed',
                error instanceof Error ? error.message : undefined
            );
        }
    }
};