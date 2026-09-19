import {error, fail} from '@sveltejs/kit';
import type {Actions, ServerLoad} from '@sveltejs/kit';

import {getHomepageSlide, updateHomepageSlide} from '$lib/server/cms/homepageStore';
import {saveHomepageHeroImage} from '$lib/server/cms/homepageMediaStore';

function actionError(status: number, errorKey: string, message?: string) {
    return fail(status, {ok: false, errorKey, message});
}

function parseOrder(value: FormDataEntryValue | null) {
    const parsed = Number(String(value ?? '0'));
    return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

export const load: ServerLoad = async ({params}) => {
    const id = Number(params.id);
    const item = await getHomepageSlide(id);

    if (!item) throw error(404, 'Homepage slide not found');

    return {item};
};

export const actions: Actions = {
    save: async ({request, params}) => {
        const id = Number(params.id);
        const existing = await getHomepageSlide(id);

        if (!existing) {
            return actionError(404, 'admin.homepage.errors.notFound');
        }

        const form = await request.formData();
        const titleEl = String(form.get('title_el') || '').trim();

        if (!titleEl) {
            return actionError(400, 'admin.homepage.errors.titleRequired');
        }

        try {
            const upload = form.get('image');
            const media =
                upload instanceof File && upload.size > 0
                    ? await saveHomepageHeroImage(upload)
                    : {
                          image480: existing.image480,
                          image960: existing.image960,
                          image1920: existing.image1920,
                          imageFallback: existing.imageFallback
                      };

            const stored = await updateHomepageSlide(existing.id, {
                enabled: form.has('enabled'),
                sortOrder: parseOrder(form.get('sort_order')),
                title: {
                    el: titleEl,
                    de: String(form.get('title_de') || '').trim() || titleEl
                },
                description: {
                    el: String(form.get('description_el') || '').trim(),
                    de: String(form.get('description_de') || '').trim()
                },
                alt: {
                    el: String(form.get('alt_el') || '').trim() || titleEl,
                    de: String(form.get('alt_de') || '').trim() || String(form.get('title_de') || '').trim() || titleEl
                },
                ...media
            });

            return {ok: true, id: stored.id};
        } catch (error) {
            return actionError(
                500,
                'admin.homepage.errors.saveFailed',
                error instanceof Error ? error.message : undefined
            );
        }
    }
};
