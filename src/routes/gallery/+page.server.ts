import type {ServerLoad} from '@sveltejs/kit';

import {listGallery} from '$lib/server/cms/galleryStore';

export const load: ServerLoad = async () => {
    const items = await listGallery();

    return {
        items
    };
};