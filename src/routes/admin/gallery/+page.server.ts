import {fail} from '@sveltejs/kit';
import type {Actions, ServerLoad} from '@sveltejs/kit';

import {deleteGallery, listGallery} from '$lib/server/cms/galleryStore';

export const load: ServerLoad = async () => {
    return {
        items: await listGallery()
    };
};

export const actions: Actions = {
    delete: async ({request}) => {
        const form = await request.formData();
        const id = String(form.get('id') || '').trim();

        if (!id) {
            return fail(400, {
                ok: false,
                id: '',
                errorKey: 'admin.gallery.toast.deleteFailed',
                message: 'Missing gallery item id.'
            });
        }

        try {
            const deleted = await deleteGallery(id);

            if (!deleted) {
                return fail(404, {
                    ok: false,
                    id,
                    errorKey: 'admin.gallery.toast.deleteFailed',
                    message: 'Gallery item was not found.'
                });
            }

            return {
                ok: true,
                id
            };
        } catch (error) {
            return fail(500, {
                ok: false,
                id,
                errorKey: 'admin.gallery.toast.deleteFailed',
                message: error instanceof Error ? error.message : 'Unknown delete error.'
            });
        }
    }
};