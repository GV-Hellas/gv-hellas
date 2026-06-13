import {error} from '@sveltejs/kit';
import {getBusinessBySlug} from '$lib/server/cms/businessStore';

export const load = async ({params}: {params: {slug: string}}) => {
    const business =
        getBusinessBySlug(params.slug) ??
        getBusinessBySlug(encodeURIComponent(params.slug));

    if (!business) {
        throw error(404, 'Business not found');
    }

    return {
        business
    };
};