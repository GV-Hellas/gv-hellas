import {listEvents, deleteEvent} from '$lib/server/cms/eventsStore';
import type {Actions} from '@sveltejs/kit';

export const load = async () => {
    const events = await listEvents();

    return {
        events
    };
};

export const actions: Actions = {
    delete: async ({request}: {request: Request}) => {
        const formData = await request.formData();
        const slug = String(formData.get('slug') || '').trim();

        if (!slug) {
            return {
                ok: false,
                message: 'Missing slug'
            };
        }

        const deleted = await deleteEvent(slug);

        if (!deleted) {
            return {
                ok: false,
                message: 'Event not found'
            };
        }

        return {
            ok: true,
            slug
        };
    }
};