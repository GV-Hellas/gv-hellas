import {fail} from '@sveltejs/kit';
import type {Actions} from '@sveltejs/kit';

import {createHomepageSlide} from '$lib/server/cms/homepageStore';
import {saveHomepageHeroImage} from '$lib/server/cms/homepageMediaStore';

function actionError(status: number, errorKey: string, message?: string) {
    return fail(status, {ok: false, errorKey, message});
}

function parseOrder(value: FormDataEntryValue | null) {
    const parsed = Number(String(value ?? '0'));
    return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

export const actions: Actions = {
    save: async ({request}) => {
        const form = await request.formData();
        const upload = form.get('image');

        if (!(upload instanceof File) || upload.size === 0) {
            return actionError(400, 'admin.homepage.errors.imageRequired');
        }

        const titleEl = String(form.get('title_el') || '').trim();
        if (!titleEl) {
            return actionError(400, 'admin.homepage.errors.titleRequired');
        }

        try {
            const media = await saveHomepageHeroImage(upload);
            const stored = await createHomepageSlide({
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
