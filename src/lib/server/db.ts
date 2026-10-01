import {getSql} from '$lib/server/neonClient';

let readyPromise: Promise<void> | null = null;

const TABLES = [
    'events',
    'gallery_items',
    'gallery_tags',
    'gallery_item_tags',
    'links',
    'businesses',
    'equipment',
    'homepage_slides'
] as const;

async function verifyDatabase() {
    const sql = getSql();
    const rows = await sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN (
              'events', 'gallery_items', 'gallery_tags', 'gallery_item_tags',
              'links', 'businesses', 'equipment', 'homepage_slides'
          )
    `;
    const found = new Set(rows.map((row) => String(row.table_name)));
    const missing = TABLES.filter((table) => !found.has(table));
    if (missing.length) throw new Error(`Neon database is missing required table(s): ${missing.join(', ')}`);
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
    return getSql();
}

export {getSql as sql};
