import type {PostgrestError} from '@supabase/supabase-js';

import {supabase} from '$lib/server/supabaseClient';

let readyPromise: Promise<void> | null = null;

type CmsTableCheck = {
    table: string;
    column: string;
};

const TABLES: CmsTableCheck[] = [
    {table: 'events', column: 'slug'},
    {table: 'gallery_items', column: 'id'},
    {table: 'gallery_tags', column: 'id'},
    {table: 'gallery_item_tags', column: 'item_id'},
    {table: 'links', column: 'id'},
    {table: 'businesses', column: 'id'},
    {table: 'equipment', column: 'id'}
];

function formatSupabaseError(error: PostgrestError) {
    return [error.message, error.details, error.hint]
        .filter(Boolean)
        .join(' ');
}

async function assertTableReadable(table: string, column: string) {
    const {error} = await supabase
        .from(table)
        .select(column, {
            head: true,
            count: 'exact'
        })
        .limit(1);

    if (error) {
        throw new Error(
            `Supabase table "${table}" is not readable. ` +
            `Create the table in Supabase and check RLS policies. ` +
            formatSupabaseError(error)
        );
    }
}

async function verifyDatabase() {
    for (const item of TABLES) {
        await assertTableReadable(item.table, item.column);
    }
}

export function ensureDatabase() {
    if (!readyPromise) {
        readyPromise = verifyDatabase().catch((error) => {
            readyPromise = null;
            throw error;
        });
    }

    return readyPromise;
}

export async function getDB() {
    await ensureDatabase();

    return supabase;
}

export {supabase};