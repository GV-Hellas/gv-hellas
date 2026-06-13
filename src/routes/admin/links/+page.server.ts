import {type Actions, fail} from '@sveltejs/kit';
import {deleteLink, listLinks} from '$lib/server/cms/linkStore';

export const load = async () => {
    return {
        links: listLinks()
    };
};

export const actions: Actions = {
    delete: async ({request}: { request: Request }) => {
        const form = await request.formData();
        const id = Number(form.get('id'));

        if (!Number.isFinite(id)) {
            return fail(400, {
                ok: false,
                message: 'Invalid link ID'
            });
        }

        deleteLink(id);

        return {
            ok: true,
            id
        };
    }
};