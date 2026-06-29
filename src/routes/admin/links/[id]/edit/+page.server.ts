import {error, fail} from '@sveltejs/kit';
import type {Actions, ServerLoad} from '@sveltejs/kit';

import {linkPayloadSchema} from '$lib/cms/links/schema';
import {getLinkById, upsertLink} from '$lib/server/cms/linkStore';
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

export const load: ServerLoad = async ({params}) => {
    const id = Number(params.id);
    const item = await getLinkById(id);

    if (!item) {
        throw error(404, 'Link not found');
    }

    return {
        item
    };
};

export const actions: Actions = {
    save: async ({request, params}) => {
        const id = Number(params.id);
        const existing = await getLinkById(id);

        if (!existing) {
            return actionError(404, 'admin.links.errors.notFound');
        }

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
            const upload = form.get('logo');

            let logo = existing.logo || payload.logo || '';
            let logoWebp = existing.logoVariants?.webp || payload.logoVariants?.webp || '';
            let logoJpg = existing.logoVariants?.jpg || payload.logoVariants?.jpg || '';

            if (upload instanceof File && upload.size > 0) {
                const savedLogo = await saveLinkLogo(upload, existing.id);

                logo = savedLogo.url;
                logoWebp = savedLogo.url;
                logoJpg = '';
            }

            const stored = await upsertLink({
                id: existing.id,
                ...payload,
                logo,
                logoVariants: {
                    webp: logoWebp,
                    jpg: logoJpg
                }
            });

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