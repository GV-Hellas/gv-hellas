import type {ServerLoad} from '@sveltejs/kit';
import {listLinks} from '$lib/server/cms/linkStore';

export const load: ServerLoad = async () => {
    const links = await listLinks();

    return {
        links
    };
};