import type {LinkPayload, LinkSaveInput, StoredLink} from '$lib/cms/links/types';
import {linkPayloadSchema} from '$lib/cms/links/schema';
import {supabase} from '$lib/server/supabaseClient';

type LinkRow = {
    id: number;
    name_el: string | null;
    name_de: string | null;
    description_html_el: string | null;
    description_html_de: string | null;
    url: string | null;
    logo: string | null;
    logo_webp: string | null;
    logo_jpg: string | null;
    created_at: string | null;
    updated_at: string | null;
};

function normalizePayload(input: LinkSaveInput): LinkPayload {
    const result = linkPayloadSchema.safeParse({
        name: input.name,
        descriptionHtml: input.descriptionHtml ?? {
            el: '',
            de: ''
        },
        url: input.url,
        logo: input.logo ?? '',
        logoVariants: input.logoVariants ?? {
            webp: '',
            jpg: ''
        }
    });

    if (!result.success) {
        throw new Error(result.error.issues[0]?.message || 'Invalid link data');
    }

    return result.data;
}

function rowToStoredLink(row: LinkRow): StoredLink {
    const now = new Date().toISOString();

    return {
        id: Number(row.id),
        name: {
            el: row.name_el || '',
            de: row.name_de || ''
        },
        descriptionHtml: {
            el: row.description_html_el || '',
            de: row.description_html_de || ''
        },
        url: row.url || '',
        logo: row.logo || row.logo_webp || row.logo_jpg || '',
        logoVariants: {
            webp: row.logo_webp || row.logo || '',
            jpg: row.logo_jpg || ''
        },
        createdAt: row.created_at || now,
        updatedAt: row.updated_at || now
    };
}

function linkToRow(payload: LinkPayload) {
    return {
        name_el: payload.name.el || '',
        name_de: payload.name.de || '',
        description_html_el: payload.descriptionHtml.el || '',
        description_html_de: payload.descriptionHtml.de || '',
        url: payload.url,
        logo: payload.logo || payload.logoVariants?.webp || '',
        logo_webp: payload.logoVariants?.webp || payload.logo || '',
        logo_jpg: payload.logoVariants?.jpg || '',
        updated_at: new Date().toISOString()
    };
}

function formatSupabaseError(context: string, error: {message: string}) {
    return new Error(`${context}: ${error.message}`);
}

export async function listLinks(): Promise<StoredLink[]> {
    const {data, error} = await supabase
        .from('links')
        .select('*')
        .order('id', {
            ascending: false
        });

    if (error) {
        throw formatSupabaseError('Listing links failed', error);
    }

    return (data || []).map((row) => rowToStoredLink(row as LinkRow));
}

export async function getLinkById(id: number): Promise<StoredLink | null> {
    if (!Number.isFinite(id)) return null;

    const {data, error} = await supabase
        .from('links')
        .select('*')
        .eq('id', id)
        .maybeSingle<LinkRow>();

    if (error) {
        throw formatSupabaseError(`Loading link "${id}" failed`, error);
    }

    return data ? rowToStoredLink(data) : null;
}

export async function upsertLink(input: LinkSaveInput): Promise<StoredLink> {
    const payload = normalizePayload(input);
    const row = linkToRow(payload);

    if (input.id && Number.isFinite(input.id)) {
        const {data, error} = await supabase
            .from('links')
            .update(row)
            .eq('id', input.id)
            .select('*')
            .single<LinkRow>();

        if (error) {
            throw formatSupabaseError(`Updating link "${input.id}" failed`, error);
        }

        return rowToStoredLink(data);
    }

    const {data, error} = await supabase
        .from('links')
        .upsert(row, {
            onConflict: 'url'
        })
        .select('*')
        .single<LinkRow>();

    if (error) {
        throw formatSupabaseError(`Saving link "${payload.url}" failed`, error);
    }

    return rowToStoredLink(data);
}

export async function saveLink(input: LinkSaveInput): Promise<StoredLink> {
    return upsertLink(input);
}

export async function deleteLink(id: number): Promise<boolean> {
    if (!Number.isFinite(id)) return false;

    const {error, count} = await supabase
        .from('links')
        .delete({count: 'exact'})
        .eq('id', id);

    if (error) {
        throw formatSupabaseError(`Deleting link "${id}" failed`, error);
    }

    return (count ?? 0) > 0;
}