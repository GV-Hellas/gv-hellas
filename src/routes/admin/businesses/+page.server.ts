import {fail} from '@sveltejs/kit';
import type {Actions, ServerLoad} from '@sveltejs/kit';

import {deleteBusiness, listBusinesses} from '$lib/server/cms/businessStore';

export const load: ServerLoad = async () => {
    return {
        businesses: await listBusinesses()
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
                errorKey: 'admin.businesses.errors.invalidId'
            });
        }

        try {
            const deleted = await deleteBusiness(id);

            if (!deleted) {
                return fail(404, {
                    ok: false,
                    id,
                    errorKey: 'admin.businesses.errors.notFound'
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
                errorKey: 'admin.businesses.errors.deleteFailed'
            });
        }
    }
};
