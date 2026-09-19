import type {HomepageSlide, HomepageSlideInput} from '$lib/cms/home/types';
import {supabase} from '$lib/server/supabaseClient';

type HomepageSlideRow = {
    id: number;
    enabled: boolean | null;
    sort_order: number | null;
    title_el: string | null;
    title_de: string | null;
    description_el: string | null;
    description_de: string | null;
    alt_el: string | null;
    alt_de: string | null;
    image_480: string | null;
    image_960: string | null;
    image_1920: string | null;
    image_fallback: string | null;
    created_at: string | null;
    updated_at: string | null;
};

function rowToSlide(row: HomepageSlideRow): HomepageSlide {
    const now = new Date().toISOString();

    return {
        id: Number(row.id),
        enabled: row.enabled !== false,
        sortOrder: Number(row.sort_order ?? 0),
        title: {
            el: row.title_el || '',
            de: row.title_de || row.title_el || ''
        },
        description: {
            el: row.description_el || '',
            de: row.description_de || row.description_el || ''
        },
        alt: {
            el: row.alt_el || row.title_el || '',
            de: row.alt_de || row.title_de || row.alt_el || row.title_el || ''
        },
        image480: row.image_480 || '',
        image960: row.image_960 || '',
        image1920: row.image_1920 || '',
        imageFallback: row.image_fallback || row.image_1920 || row.image_960 || row.image_480 || '',
        createdAt: row.created_at || now,
        updatedAt: row.updated_at || now
    };
}

function slideToRow(slide: HomepageSlideInput) {
    return {
        enabled: slide.enabled,
        sort_order: slide.sortOrder,
        title_el: slide.title.el || '',
        title_de: slide.title.de || slide.title.el || '',
        description_el: slide.description.el || '',
        description_de: slide.description.de || '',
        alt_el: slide.alt.el || slide.title.el || '',
        alt_de: slide.alt.de || slide.alt.el || slide.title.de || slide.title.el || '',
        image_480: slide.image480 || '',
        image_960: slide.image960 || '',
        image_1920: slide.image1920 || '',
        image_fallback: slide.imageFallback || slide.image1920 || slide.image960 || slide.image480 || '',
        updated_at: new Date().toISOString()
    };
}

function formatSupabaseError(context: string, error: {message: string}) {
    return new Error(`${context}: ${error.message}`);
}

export async function listHomepageSlides(includeDisabled = false): Promise<HomepageSlide[]> {
    const query = supabase
        .from('homepage_slides')
        .select('*')
        .order('sort_order', {ascending: true})
        .order('id', {ascending: true});

    const {data, error} = includeDisabled
        ? await query
        : await query.eq('enabled', true);

    if (error) {
        throw formatSupabaseError('Listing homepage slides failed', error);
    }

    return (data || []).map((row) => rowToSlide(row as HomepageSlideRow));
}

export async function getHomepageSlide(id: number): Promise<HomepageSlide | null> {
    if (!Number.isFinite(id)) return null;

    const {data, error} = await supabase
        .from('homepage_slides')
        .select('*')
        .eq('id', id)
        .maybeSingle<HomepageSlideRow>();

    if (error) {
        throw formatSupabaseError(`Loading homepage slide "${id}" failed`, error);
    }

    return data ? rowToSlide(data) : null;
}

export async function createHomepageSlide(input: HomepageSlideInput): Promise<HomepageSlide> {
    const {data, error} = await supabase
        .from('homepage_slides')
        .insert(slideToRow(input))
        .select('*')
        .single<HomepageSlideRow>();

    if (error) {
        throw formatSupabaseError('Creating homepage slide failed', error);
    }

    return rowToSlide(data);
}

export async function updateHomepageSlide(id: number, input: HomepageSlideInput): Promise<HomepageSlide> {
    if (!Number.isFinite(id)) {
        throw new Error('Invalid homepage slide id');
    }

    const {data, error} = await supabase
        .from('homepage_slides')
        .update(slideToRow(input))
        .eq('id', id)
        .select('*')
        .single<HomepageSlideRow>();

    if (error) {
        throw formatSupabaseError(`Updating homepage slide "${id}" failed`, error);
    }

    return rowToSlide(data);
}

export async function deleteHomepageSlide(id: number): Promise<boolean> {
    if (!Number.isFinite(id)) return false;

    const {error, count} = await supabase
        .from('homepage_slides')
        .delete({count: 'exact'})
        .eq('id', id);

    if (error) {
        throw formatSupabaseError(`Deleting homepage slide "${id}" failed`, error);
    }

    return (count ?? 0) > 0;
}
