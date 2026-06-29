import {fail} from '@sveltejs/kit';
import type {Actions, ServerLoad} from '@sveltejs/kit';

import {deleteEvent, listEvents} from '$lib/server/cms/eventsStore';

export const load: ServerLoad = async () => {
    const events = await listEvents();

    return {
        events
    };
};

export const actions: Actions = {
    delete: async ({request}) => {
        const formData = await request.formData();
        const slug = String(formData.get('slug') || '').trim();

        if (!slug) {
            return fail(400, {
                ok: false,
                slug: '',
                message: 'Missing slug'
            });
        }

        try {
            const deleted = await deleteEvent(slug);

            if (!deleted) {
                return fail(404, {
                    ok: false,
                    slug,
                    message: 'Event not found'
                });
            }

            return {
                ok: true,
                slug
            };
        } catch (error) {
            return fail(500, {
                ok: false,
                slug,
                message: error instanceof Error ? error.message : 'Unknown delete error.'
            });
        }
    }
};