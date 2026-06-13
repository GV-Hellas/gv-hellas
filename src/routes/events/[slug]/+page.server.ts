import {error} from '@sveltejs/kit';
import {getEventBySlug} from '$lib/server/cms/eventsStore';

export const load = async ({params}: { params: { slug: string } }) => {
    const event =
        (await getEventBySlug(params.slug)) ??
        (await getEventBySlug(encodeURIComponent(params.slug)));

    if (!event) {
        throw error(404, 'Event not found');
    }

    return {
        event
    };
};