import {mkdirSync} from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

import type {LinkPayload, LinkSaveInput, StoredLink} from '$lib/cms/links/types';
import {linkPayloadSchema} from '$lib/cms/links/schema';

const DATA_DIR = path.resolve('data');
const DB_PATH = path.join(DATA_DIR, 'cms.db');

type LinkRow = {
    id: number;
    name_el?: string | null;
    name_de?: string | null;
    description_html_el?: string | null;
    description_html_de?: string | null;
    url?: string | null;
    logo?: string | null;
    logo_webp?: string | null;
    logo_jpg?: string | null;
    payload?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
};

let db: Database.Database | null = null;

function getDb() {
    if (db) return db;

    mkdirSync(DATA_DIR, {recursive: true});

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');

    ensureLinksTable(db);

    return db;
}

function tableExists(database: Database.Database, tableName: string) {
    const row = database
        .prepare(
            `
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
              AND name = ?
            LIMIT 1
            `
        )
        .get(tableName);

    return !!row;
}

function getColumns(database: Database.Database, tableName: string) {
    return database
        .prepare(`PRAGMA table_info(${tableName})`)
        .all()
        .map((column) => String((column as {name: unknown}).name));
}

function ensureColumn(
    database: Database.Database,
    tableName: string,
    columns: string[],
    definition: string
) {
    const columnName = definition.split(/\s+/)[0];

    if (columns.includes(columnName)) return;

    database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`);
    columns.push(columnName);
}

function ensureLinksTable(database: Database.Database) {
    if (!tableExists(database, 'links')) {
        database.exec(`
            CREATE TABLE links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name_el TEXT NOT NULL DEFAULT '',
                name_de TEXT NOT NULL DEFAULT '',
                description_html_el TEXT NOT NULL DEFAULT '',
                description_html_de TEXT NOT NULL DEFAULT '',
                url TEXT NOT NULL,
                logo TEXT NOT NULL DEFAULT '',
                logo_webp TEXT NOT NULL DEFAULT '',
                logo_jpg TEXT NOT NULL DEFAULT '',
                payload TEXT NOT NULL DEFAULT '{}',
                created_at TEXT NOT NULL DEFAULT '',
                updated_at TEXT NOT NULL DEFAULT ''
            )
        `);

        return;
    }

    const columns = getColumns(database, 'links');

    ensureColumn(database, 'links', columns, `name_el TEXT NOT NULL DEFAULT ''`);
    ensureColumn(database, 'links', columns, `name_de TEXT NOT NULL DEFAULT ''`);
    ensureColumn(database, 'links', columns, `description_html_el TEXT NOT NULL DEFAULT ''`);
    ensureColumn(database, 'links', columns, `description_html_de TEXT NOT NULL DEFAULT ''`);
    ensureColumn(database, 'links', columns, `url TEXT NOT NULL DEFAULT ''`);
    ensureColumn(database, 'links', columns, `logo TEXT NOT NULL DEFAULT ''`);
    ensureColumn(database, 'links', columns, `logo_webp TEXT NOT NULL DEFAULT ''`);
    ensureColumn(database, 'links', columns, `logo_jpg TEXT NOT NULL DEFAULT ''`);
    ensureColumn(database, 'links', columns, `payload TEXT NOT NULL DEFAULT '{}'`);
    ensureColumn(database, 'links', columns, `created_at TEXT NOT NULL DEFAULT ''`);
    ensureColumn(database, 'links', columns, `updated_at TEXT NOT NULL DEFAULT ''`);
}

function parseJson<T>(value: unknown, fallback: T): T {
    if (typeof value !== 'string' || !value.trim()) {
        return fallback;
    }

    try {
        return JSON.parse(value) as T;
    } catch {
        return fallback;
    }
}

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

    const parsedPayload = parseJson<Partial<StoredLink> | null>(row.payload, null);

    const payload: LinkPayload = parsedPayload
        ? {
            name: {
                el: parsedPayload.name?.el ?? row.name_el ?? '',
                de: parsedPayload.name?.de ?? row.name_de ?? ''
            },
            descriptionHtml: {
                el:
                    parsedPayload.descriptionHtml?.el ??
                    row.description_html_el ??
                    '',
                de:
                    parsedPayload.descriptionHtml?.de ??
                    row.description_html_de ??
                    ''
            },
            url: parsedPayload.url ?? row.url ?? '',
            logo: parsedPayload.logo ?? row.logo ?? '',
            logoVariants: {
                webp:
                    parsedPayload.logoVariants?.webp ??
                    row.logo_webp ??
                    '',
                jpg:
                    parsedPayload.logoVariants?.jpg ??
                    row.logo_jpg ??
                    ''
            }
        }
        : {
            name: {
                el: row.name_el ?? '',
                de: row.name_de ?? ''
            },
            descriptionHtml: {
                el: row.description_html_el ?? '',
                de: row.description_html_de ?? ''
            },
            url: row.url ?? '',
            logo: row.logo ?? '',
            logoVariants: {
                webp: row.logo_webp ?? '',
                jpg: row.logo_jpg ?? ''
            }
        };

    return {
        ...payload,
        id: Number(row.id),
        createdAt: parsedPayload?.createdAt ?? row.created_at ?? now,
        updatedAt: parsedPayload?.updatedAt ?? row.updated_at ?? now
    };
}

function getExistingRow(id: number) {
    const database = getDb();

    return database
        .prepare(
            `
            SELECT *
            FROM links
            WHERE id = ?
            LIMIT 1
            `
        )
        .get(id) as LinkRow | undefined;
}

export function listLinks(): StoredLink[] {
    const database = getDb();

    const rows = database
        .prepare(
            `
            SELECT *
            FROM links
            ORDER BY id DESC
            `
        )
        .all() as LinkRow[];

    return rows.map(rowToStoredLink);
}

export function getLinkById(id: number): StoredLink | null {
    if (!Number.isFinite(id)) return null;

    const row = getExistingRow(id);

    return row ? rowToStoredLink(row) : null;
}

export function upsertLink(input: LinkSaveInput): StoredLink {
    const database = getDb();
    const now = new Date().toISOString();
    const payload = normalizePayload(input);

    const existingRow = input.id ? getExistingRow(input.id) : undefined;
    const existing = existingRow ? rowToStoredLink(existingRow) : null;

    const stored: StoredLink = {
        ...payload,
        id: existing?.id ?? 0,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
    };

    const payloadJson = JSON.stringify(stored);

    if (existing) {
        database
            .prepare(
                `
                UPDATE links
                SET
                    name_el = ?,
                    name_de = ?,
                    description_html_el = ?,
                    description_html_de = ?,
                    url = ?,
                    logo = ?,
                    logo_webp = ?,
                    logo_jpg = ?,
                    payload = ?,
                    updated_at = ?
                WHERE id = ?
                `
            )
            .run(
                stored.name.el,
                stored.name.de,
                stored.descriptionHtml.el,
                stored.descriptionHtml.de,
                stored.url,
                stored.logo ?? '',
                stored.logoVariants?.webp ?? '',
                stored.logoVariants?.jpg ?? '',
                payloadJson,
                stored.updatedAt,
                stored.id
            );

        return stored;
    }

    const result = database
        .prepare(
            `
            INSERT INTO links (
                name_el,
                name_de,
                description_html_el,
                description_html_de,
                url,
                logo,
                logo_webp,
                logo_jpg,
                payload,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `
        )
        .run(
            stored.name.el,
            stored.name.de,
            stored.descriptionHtml.el,
            stored.descriptionHtml.de,
            stored.url,
            stored.logo ?? '',
            stored.logoVariants?.webp ?? '',
            stored.logoVariants?.jpg ?? '',
            payloadJson,
            stored.createdAt,
            stored.updatedAt
        );

    const id = Number(result.lastInsertRowid);

    const inserted: StoredLink = {
        ...stored,
        id
    };

    database
        .prepare(
            `
            UPDATE links
            SET payload = ?
            WHERE id = ?
            `
        )
        .run(JSON.stringify(inserted), id);

    return inserted;
}

export function saveLink(input: LinkSaveInput): StoredLink {
    return upsertLink(input);
}

export function deleteLink(id: number): boolean {
    if (!Number.isFinite(id)) return false;

    const database = getDb();

    const result = database
        .prepare(
            `
            DELETE FROM links
            WHERE id = ?
            `
        )
        .run(id);

    return result.changes > 0;
}