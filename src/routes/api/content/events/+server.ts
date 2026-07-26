import {json} from '@sveltejs/kit';
import type {RequestHandler} from './$types';

import {listEvents} from '$lib/server/cms/eventsStore';

export const GET: RequestHandler = async () => {
    return json(await listEvents());
};
