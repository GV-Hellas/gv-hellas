import {type Actions, fail} from '@sveltejs/kit';
import {deleteBusiness, listBusinesses} from '$lib/server/cms/businessStore';

export const load = async () => {
    return {
        businesses: listBusinesses()
    };
};

export const actions: Actions = {
    delete: async ({request}) => {
        const form = await request.formData();
        const id = Number(form.get('id'));

        if (!Number.isFinite(id)) {
            return fail(400, {
                ok: false,
                message: 'Invalid business ID'
            });
        }

        const deleted = deleteBusiness(id);

        if (!deleted) {
            return fail(404, {
                ok: false,
                message: 'Business not found'
            });
        }

        return {
            ok: true,
            id
        };
    }
};