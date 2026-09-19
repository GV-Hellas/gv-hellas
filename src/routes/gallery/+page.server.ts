import type {ServerLoad} from '@sveltejs/kit';

import {listGallery} from '$lib/server/cms/galleryStore';

export const load: ServerLoad = async ({setHeaders, depends}) => {
    // Gallery content changes from the admin and should be visible immediately.
    // Opt this route out of the global public-page cache so deleted/edited items
    // cannot remain in a browser or Vercel CDN cache.
    setHeaders({
        'cache-control': 'no-store, max-age=0'
    });

    depends('cms:gallery');

    return {
        items: await listGallery()
    };
};
