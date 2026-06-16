import {redirect} from '@sveltejs/kit';
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
        const id = String(form.get('id') || '');

        if (id) {
            await deleteGallery(id);
        }

        throw redirect(303, '/admin/gallery');
    }
};