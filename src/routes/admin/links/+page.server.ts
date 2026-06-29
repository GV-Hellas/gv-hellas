import {fail} from '@sveltejs/kit';
import type {Actions, ServerLoad} from '@sveltejs/kit';

import {deleteLink, listLinks} from '$lib/server/cms/linkStore';

export const load: ServerLoad = async () => {
    return {
        links: await listLinks()
    };
};

export const actions: Actions = {
    delete: async ({request}) => {
        const form = await request.formData();
        const id = Number(form.get('id'));

        if (!Number.isFinite(id) || id <= 0) {
            return fail(400, {
                ok: false,
                id: null,
                errorKey: 'admin.links.errors.invalidId'
            });
        }

        try {
            const deleted = await deleteLink(id);

            if (!deleted) {
                return fail(404, {
                    ok: false,
                    id,
                    errorKey: 'admin.links.errors.notFound'
                });
            }

            return {
                ok: true,
                id
            };
        } catch {
            return fail(500, {
                ok: false,
                id,
                errorKey: 'admin.links.errors.deleteFailed'
            });
        }
    }
};