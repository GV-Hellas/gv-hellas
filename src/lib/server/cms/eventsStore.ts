import {mkdirSync} from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

import type {EventPayload, StoredEvent} from '$lib/cms/events/types';

const DATA_DIR = path.resolve('data');
const DB_PATH = path.join(DATA_DIR, 'cms.db');

type EventRow = {
    rowid?: number;
    id?: string | null;
    slug: string;
    payload?: string | null;
    date?: string | null;
    time?: string | null;
    location?: string | null;
    category?: string | null;
    title_el?: string | null;
    title_de?: string | null;
    description_el?: string | null;
    description_de?: string | null;
    excerpt_el?: string | null;
    excerpt_de?: string | null;
    content_el?: string | null;
    content_de?: string | null;
    price_members?: number | null;
    price_public?: number | null;
    sections?: string | null;
    media_blocks?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
};

let db: Database.Database | null = null;

function getDb() {
    if (db) return db;

    mkdirSync(DATA_DIR, {recursive: true});

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');

    ensureEventsTable(db);

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
            `
        )
        .get(tableName);

    return !!row;
}

function getColumns(database: Database.Database, tableName: string) {
    return database
        .prepare(`PRAGMA table_info(${tableName})`)
        .all()
        .map((column) => String((column as { name: unknown }).name));
}

function hasColumn(columns: string[], column: string) {
    return columns.includes(column);
}

function ensureColumn(database: Database.Database, tableName: string, columns: string[], definition: string) {
    const columnName = definition.split(/\s+/)[0];

    if (hasColumn(columns, columnName)) return;

    database.exec(`ALTER TABLE ${tableName}
        ADD COLUMN ${definition}`);
    columns.push(columnName);
}

function ensureEventsTable(database: Database.Database) {
    if (!tableExists(database, 'events')) {
        database.exec(`
            CREATE TABLE events
            (
                id         TEXT,
                slug       TEXT NOT NULL UNIQUE,
                payload    TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);

        return;
    }

    const columns = getColumns(database, 'events');

    ensureColumn(database, 'events', columns, 'payload TEXT');
    ensureColumn(database, 'events', columns, 'created_at TEXT');
    ensureColumn(database, 'events', columns, 'updated_at TEXT');

    if (!hasColumn(columns, 'id')) {
        ensureColumn(database, 'events', columns, 'id TEXT');
    }
}

function safeSlug(slug: string) {
    return slug
        .trim()
        .replace(/\.json$/i, '')
        .replaceAll('/', '')
        .replaceAll('\\', '');
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

function nullableNumber(value: unknown) {
    if (value === null || value === undefined || value === '') return null;

    const n = Number(value);

    return Number.isFinite(n) ? n : null;
}

function emptyLocalized() {
    return {
        el: '',
        de: ''
    };
}

function normalizeLegacyRow(row: EventRow): StoredEvent {
    const now = new Date().toISOString();

    const sections = parseJson<EventPayload['sections']>(row.sections, []);

    const legacySections =
        sections.length > 0
            ? sections
            : [
                {
                    id: crypto.randomUUID(),
                    beforeHtml: {
                        el: row.content_el || '',
                        de: row.content_de || ''
                    },
                    media: parseJson(row.media_blocks, []),
                    afterHtml: emptyLocalized()
                }
            ];

    return {
        id: row.id || crypto.randomUUID(),
        slug: row.slug,
        title: {
            el: row.title_el || '',
            de: row.title_de || ''
        },
        description: {
            el: row.description_el || row.excerpt_el || '',
            de: row.description_de || row.excerpt_de || ''
        },
        date: row.date || '',
        time: row.time || '',
        location: row.location || '',
        category: row.category || 'general',
        priceMembers: nullableNumber(row.price_members),
        pricePublic: nullableNumber(row.price_public),
        sections: legacySections,
        createdAt: row.created_at || row.createdAt || now,
        updatedAt: row.updated_at || row.updatedAt || now
    };
}

function rowToStoredEvent(row: EventRow): StoredEvent {
    if (row.payload) {
        const parsed = parseJson<StoredEvent | null>(row.payload, null);

        if (parsed) {
            return {
                ...parsed,
                id: parsed.id || row.id || crypto.randomUUID(),
                slug: parsed.slug || row.slug,
                createdAt: parsed.createdAt || row.created_at || row.createdAt || new Date().toISOString(),
                updatedAt: parsed.updatedAt || row.updated_at || row.updatedAt || new Date().toISOString()
            };
        }
    }

    return normalizeLegacyRow(row);
}

function getEventRow(slug: string): EventRow | null {
    const cleanSlug = safeSlug(slug);

    if (!cleanSlug) return null;

    const database = getDb();

    const row = database
        .prepare(
            `
                SELECT rowid, *
                FROM events
                WHERE slug = ?
                LIMIT 1
            `
        )
        .get(cleanSlug) as EventRow | undefined;

    return row ?? null;
}

export async function getEvent(slug: string): Promise<StoredEvent | null> {
    const row = getEventRow(slug);

    if (!row) {
        return null;
    }

    return rowToStoredEvent(row);
}

export async function getEventBySlug(slug: string): Promise<StoredEvent | null> {
    return getEvent(slug);
}

export async function saveEvent(event: EventPayload, slug: string): Promise<StoredEvent> {
    const cleanSlug = safeSlug(slug);

    if (!cleanSlug) {
        throw new Error('Invalid event slug');
    }

    const database = getDb();
    const now = new Date().toISOString();
    const existingRow = getEventRow(cleanSlug);
    const existing = existingRow ? rowToStoredEvent(existingRow) : null;

    const stored: StoredEvent = {
        ...event,
        id: existing?.id ?? crypto.randomUUID(),
        slug: cleanSlug,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
    };

    const payload = JSON.stringify(stored);

    if (existingRow?.rowid) {
        database
            .prepare(
                `
                    UPDATE events
                    SET id         = ?,
                        slug       = ?,
                        payload    = ?,
                        created_at = ?,
                        updated_at = ?
                    WHERE rowid = ?
                `
            )
            .run(stored.id, stored.slug, payload, stored.createdAt, stored.updatedAt, existingRow.rowid);
    } else {
        database
            .prepare(
                `
                    INSERT INTO events (id,
                                        slug,
                                        payload,
                                        created_at,
                                        updated_at)
                    VALUES (?, ?, ?, ?, ?)
                `
            )
            .run(stored.id, stored.slug, payload, stored.createdAt, stored.updatedAt);
    }

    return stored;
}

export async function listEvents(): Promise<StoredEvent[]> {
    const database = getDb();

    const tables = database
        .prepare(
            `
                SELECT name
                FROM sqlite_master
                WHERE type = 'table'
                ORDER BY name
            `
        )
        .all();

    const rows = database
        .prepare(
            `
                SELECT rowid, *
                FROM events
                ORDER BY date DESC
            `
        )
        .all() as EventRow[];

    return rows
        .map(rowToStoredEvent)
        .sort((a, b) => {
            const dateA = `${a.date || ''} ${a.time || ''}`;
            const dateB = `${b.date || ''} ${b.time || ''}`;

            return dateB.localeCompare(dateA);
        });
}

export async function deleteEvent(slug: string): Promise<boolean> {
    const cleanSlug = safeSlug(slug);

    if (!cleanSlug) {
        return false;
    }

    const database = getDb();

    const result = database
        .prepare(
            `
                DELETE
                FROM events
                WHERE slug = ?
            `
        )
        .run(cleanSlug);

    return result.changes > 0;
}