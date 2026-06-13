import {mkdirSync} from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

import {slugify} from '$lib/utils';
import type {BusinessPayload, BusinessSaveInput, StoredBusiness} from '$lib/cms/business/types';
import {businessPayloadSchema} from '$lib/cms/business/validation';

const DATA_DIR = path.resolve('data');
const DB_PATH = path.join(DATA_DIR, 'cms.db');

type BusinessRow = {
    id: number;
    sponsor_type?: string | null;
    name?: string | null;
    slug?: string | null;
    logo?: string | null;
    description_el?: string | null;
    description_de?: string | null;
    url?: string | null;
    email?: string | null;
    telephone?: string | null;
    contact_person?: string | null;
    sections?: string | null;
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

    ensureBusinessesTable(db);

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

function ensureBusinessesTable(database: Database.Database) {
    if (!tableExists(database, 'businesses')) {
        database.exec(`
            CREATE TABLE businesses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sponsor_type TEXT NOT NULL DEFAULT 'listed',
                name TEXT NOT NULL DEFAULT '',
                slug TEXT NOT NULL UNIQUE,
                logo TEXT NOT NULL DEFAULT '',
                description_el TEXT NOT NULL DEFAULT '',
                description_de TEXT NOT NULL DEFAULT '',
                url TEXT NOT NULL DEFAULT '',
                email TEXT NOT NULL DEFAULT '',
                telephone TEXT NOT NULL DEFAULT '',
                contact_person TEXT NOT NULL DEFAULT '',
                sections TEXT NOT NULL DEFAULT '[]',
                payload TEXT NOT NULL DEFAULT '{}',
                created_at TEXT NOT NULL DEFAULT '',
                updated_at TEXT NOT NULL DEFAULT ''
            )
        `);

        return;
    }

    const columns = getColumns(database, 'businesses');

    ensureColumn(database, 'businesses', columns, `sponsor_type TEXT NOT NULL DEFAULT 'listed'`);
    ensureColumn(database, 'businesses', columns, `name TEXT NOT NULL DEFAULT ''`);
    ensureColumn(database, 'businesses', columns, `slug TEXT NOT NULL DEFAULT ''`);
    ensureColumn(database, 'businesses', columns, `logo TEXT NOT NULL DEFAULT ''`);
    ensureColumn(database, 'businesses', columns, `description_el TEXT NOT NULL DEFAULT ''`);
    ensureColumn(database, 'businesses', columns, `description_de TEXT NOT NULL DEFAULT ''`);
    ensureColumn(database, 'businesses', columns, `url TEXT NOT NULL DEFAULT ''`);
    ensureColumn(database, 'businesses', columns, `email TEXT NOT NULL DEFAULT ''`);
    ensureColumn(database, 'businesses', columns, `telephone TEXT NOT NULL DEFAULT ''`);
    ensureColumn(database, 'businesses', columns, `contact_person TEXT NOT NULL DEFAULT ''`);
    ensureColumn(database, 'businesses', columns, `sections TEXT NOT NULL DEFAULT '[]'`);
    ensureColumn(database, 'businesses', columns, `payload TEXT NOT NULL DEFAULT '{}'`);
    ensureColumn(database, 'businesses', columns, `created_at TEXT NOT NULL DEFAULT ''`);
    ensureColumn(database, 'businesses', columns, `updated_at TEXT NOT NULL DEFAULT ''`);

    database.exec(`CREATE UNIQUE INDEX IF NOT EXISTS businesses_slug_unique ON businesses(slug)`);
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

function safeSlug(value: string) {
    return value
        .trim()
        .replace(/\.json$/i, '')
        .replaceAll('/', '')
        .replaceAll('\\', '');
}

function normalizeSlug(value: string, fallbackName: string) {
    const fromInput = safeSlug(value);
    const fromName = safeSlug(slugify(fallbackName));

    return fromInput || fromName;
}

function getRowById(id: number) {
    const database = getDb();

    return database
        .prepare(
            `
            SELECT *
            FROM businesses
            WHERE id = ?
            LIMIT 1
            `
        )
        .get(id) as BusinessRow | undefined;
}

function getRowBySlug(slug: string) {
    const cleanSlug = safeSlug(slug);

    if (!cleanSlug) return undefined;

    const database = getDb();

    return database
        .prepare(
            `
            SELECT *
            FROM businesses
            WHERE slug = ?
            LIMIT 1
            `
        )
        .get(cleanSlug) as BusinessRow | undefined;
}

function slugExists(slug: string, exceptId?: number) {
    const database = getDb();

    const row = database
        .prepare(
            `
            SELECT id
            FROM businesses
            WHERE slug = ?
              AND (? IS NULL OR id != ?)
            LIMIT 1
            `
        )
        .get(slug, exceptId ?? null, exceptId ?? null) as {id: number} | undefined;

    return !!row;
}

function uniqueSlug(baseSlug: string, exceptId?: number) {
    let candidate = safeSlug(baseSlug);
    let counter = 2;

    while (slugExists(candidate, exceptId)) {
        candidate = `${baseSlug}-${counter}`;
        counter += 1;
    }

    return candidate;
}

function rowToStoredBusiness(row: BusinessRow): StoredBusiness {
    const now = new Date().toISOString();
    const parsedPayload = parseJson<Partial<StoredBusiness> | null>(row.payload, null);

    if (parsedPayload) {
        return {
            sponsorType: parsedPayload.sponsorType ?? 'listed',
            name: parsedPayload.name ?? row.name ?? '',
            slug: parsedPayload.slug ?? row.slug ?? '',
            logo: parsedPayload.logo ?? row.logo ?? '',
            description: {
                el: parsedPayload.description?.el ?? row.description_el ?? '',
                de: parsedPayload.description?.de ?? row.description_de ?? ''
            },
            url: parsedPayload.url ?? row.url ?? '',
            email: parsedPayload.email ?? row.email ?? '',
            telephone: parsedPayload.telephone ?? row.telephone ?? '',
            contactPerson: parsedPayload.contactPerson ?? row.contact_person ?? '',
            sections: parsedPayload.sections ?? parseJson(row.sections, []),
            id: Number(row.id),
            createdAt: parsedPayload.createdAt ?? row.created_at ?? now,
            updatedAt: parsedPayload.updatedAt ?? row.updated_at ?? now
        };
    }

    return {
        id: Number(row.id),
        sponsorType: row.sponsor_type === 'gold' || row.sponsor_type === 'silver' || row.sponsor_type === 'bronze'
            ? row.sponsor_type
            : 'listed',
        name: row.name ?? '',
        slug: row.slug ?? '',
        logo: row.logo ?? '',
        description: {
            el: row.description_el ?? '',
            de: row.description_de ?? ''
        },
        url: row.url ?? '',
        email: row.email ?? '',
        telephone: row.telephone ?? '',
        contactPerson: row.contact_person ?? '',
        sections: parseJson(row.sections, []),
        createdAt: row.created_at ?? now,
        updatedAt: row.updated_at ?? now
    };
}

function normalizePayload(input: BusinessSaveInput): BusinessPayload {
    const result = businessPayloadSchema.safeParse(input);

    if (!result.success) {
        throw new Error(result.error.issues[0]?.message || 'Invalid business data');
    }

    return result.data as BusinessPayload;
}

export function listBusinesses(): StoredBusiness[] {
    const database = getDb();

    const rows = database
        .prepare(
            `
            SELECT *
            FROM businesses
            ORDER BY
                CASE sponsor_type
                    WHEN 'gold' THEN 1
                    WHEN 'silver' THEN 2
                    WHEN 'bronze' THEN 3
                    ELSE 4
                END,
                name COLLATE NOCASE ASC
            `
        )
        .all() as BusinessRow[];

    return rows.map(rowToStoredBusiness);
}

export function getBusinessById(id: number): StoredBusiness | null {
    if (!Number.isFinite(id)) return null;

    const row = getRowById(id);

    return row ? rowToStoredBusiness(row) : null;
}

export function getBusinessBySlug(slug: string): StoredBusiness | null {
    const row = getRowBySlug(slug) ?? getRowBySlug(encodeURIComponent(slug));

    return row ? rowToStoredBusiness(row) : null;
}

export function saveBusiness(input: BusinessSaveInput, currentSlug?: string): StoredBusiness {
    const database = getDb();
    const now = new Date().toISOString();

    const existingRow =
        input.id
            ? getRowById(input.id)
            : currentSlug
                ? getRowBySlug(currentSlug)
                : input.slug
                    ? getRowBySlug(input.slug)
                    : undefined;

    const existing = existingRow ? rowToStoredBusiness(existingRow) : null;

    const payload = normalizePayload({
        ...input,
        slug: normalizeSlug(input.slug, input.name)
    });

    const stored: StoredBusiness = {
        ...payload,
        id: existing?.id ?? 0,
        slug: uniqueSlug(payload.slug, existing?.id),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
    };

    const payloadJson = JSON.stringify(stored);
    const sectionsJson = JSON.stringify(stored.sections);

    if (existing) {
        database
            .prepare(
                `
                UPDATE businesses
                SET
                    sponsor_type = ?,
                    name = ?,
                    slug = ?,
                    logo = ?,
                    description_el = ?,
                    description_de = ?,
                    url = ?,
                    email = ?,
                    telephone = ?,
                    contact_person = ?,
                    sections = ?,
                    payload = ?,
                    updated_at = ?
                WHERE id = ?
                `
            )
            .run(
                stored.sponsorType,
                stored.name,
                stored.slug,
                stored.logo ?? '',
                stored.description.el,
                stored.description.de,
                stored.url,
                stored.email,
                stored.telephone,
                stored.contactPerson,
                sectionsJson,
                payloadJson,
                stored.updatedAt,
                stored.id
            );

        return stored;
    }

    const result = database
        .prepare(
            `
            INSERT INTO businesses (
                sponsor_type,
                name,
                slug,
                logo,
                description_el,
                description_de,
                url,
                email,
                telephone,
                contact_person,
                sections,
                payload,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `
        )
        .run(
            stored.sponsorType,
            stored.name,
            stored.slug,
            stored.logo ?? '',
            stored.description.el,
            stored.description.de,
            stored.url,
            stored.email,
            stored.telephone,
            stored.contactPerson,
            sectionsJson,
            payloadJson,
            stored.createdAt,
            stored.updatedAt
        );

    const inserted: StoredBusiness = {
        ...stored,
        id: Number(result.lastInsertRowid)
    };

    database
        .prepare(
            `
            UPDATE businesses
            SET payload = ?
            WHERE id = ?
            `
        )
        .run(JSON.stringify(inserted), inserted.id);

    return inserted;
}

export function deleteBusiness(id: number): boolean {
    if (!Number.isFinite(id)) return false;

    const database = getDb();

    const result = database
        .prepare(
            `
            DELETE FROM businesses
            WHERE id = ?
            `
        )
        .run(id);

    return result.changes > 0;
}