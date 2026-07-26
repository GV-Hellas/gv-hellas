import {error, json} from '@sveltejs/kit';
import type {RequestHandler} from './$types';

import {getEventBySlug} from '$lib/server/cms/eventsStore';

export const GET: RequestHandler = async ({params}) => {
    const event = await getEventBySlug(params.slug);

    if (!event) {
        throw error(404, 'Event not found');
    }

    return json(event);
};
