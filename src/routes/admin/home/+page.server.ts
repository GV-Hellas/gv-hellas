import {fail} from '@sveltejs/kit';
import type {Actions, ServerLoad} from '@sveltejs/kit';

import {deleteHomepageSlide, listHomepageSlides} from '$lib/server/cms/homepageStore';

export const load: ServerLoad = async () => {
    return {
        slides: await listHomepageSlides(true)
    };
};

export const actions: Actions = {
    delete: async ({request}) => {
        const form = await request.formData();
        const id = Number(form.get('id'));

        if (!Number.isFinite(id)) {
            return fail(400, {
                ok: false,
                errorKey: 'admin.homepage.errors.invalidId'
            });
        }

        try {
            const deleted = await deleteHomepageSlide(id);

            if (!deleted) {
                return fail(404, {
                    ok: false,
                    id,
                    errorKey: 'admin.homepage.errors.notFound'
                });
            }

            return {ok: true, id};
        } catch (error) {
            return fail(500, {
                ok: false,
                id,
                errorKey: 'admin.homepage.errors.deleteFailed',
                message: error instanceof Error ? error.message : undefined
            });
        }
    }
};
