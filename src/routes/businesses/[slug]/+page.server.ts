import {error} from '@sveltejs/kit';
import type {PageServerLoad} from './$types';

import {getBusinessBySlug} from '$lib/server/cms/businessStore';

export const load: PageServerLoad = async ({params}) => {
    let decodedSlug = params.slug;

    try {
        decodedSlug = decodeURIComponent(params.slug);
    } catch {
        decodedSlug = params.slug;
    }

    const business =
        (await getBusinessBySlug(decodedSlug)) ??
        (decodedSlug !== params.slug ? await getBusinessBySlug(params.slug) : null);

    if (!business) {
        throw error(404, 'Business not found');
    }

    return {
        business
    };
};
