import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DB_PATH = path.resolve('data/cms.db');

if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?.*)?$/i;
const AUDIO_EXT = /\.(mp3|wav|m4a|ogg|aac)(\?.*)?$/i;

db.exec(`
  CREATE TABLE IF NOT EXISTS events
  (
    slug              TEXT PRIMARY KEY,
    date              TEXT NOT NULL,
    time              TEXT NOT NULL DEFAULT '',
    title_el          TEXT NOT NULL,
    title_de          TEXT NOT NULL,
    description_el    TEXT,
    description_de    TEXT,
    location          TEXT NOT NULL DEFAULT '',
    category          TEXT NOT NULL DEFAULT 'general',
    price_members     REAL,
    price_public      REAL,
    sections          TEXT NOT NULL DEFAULT '[]',
    created_at        TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at        TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS gallery_items
  (
    id         TEXT PRIMARY KEY,
    type       TEXT NOT NULL DEFAULT 'image',
    src        TEXT NOT NULL,
    src_webp   TEXT,
    src_jpg    TEXT,
    alt        TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS gallery_tags
  (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS gallery_item_tags
  (
    item_id TEXT NOT NULL,
    tag_id  INTEGER NOT NULL,
    PRIMARY KEY (item_id, tag_id),
    FOREIGN KEY (item_id) REFERENCES gallery_items (id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES gallery_tags (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS links
  (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name_el   TEXT,
    name_de   TEXT,
    url       TEXT NOT NULL,
    logo      TEXT,
    logo_webp TEXT,
    logo_jpg  TEXT
  );

  CREATE TABLE IF NOT EXISTS businesses
  (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    url       TEXT NOT NULL,
    logo      TEXT NOT NULL DEFAULT '',
    logo_webp TEXT,
    logo_jpg  TEXT
  );

  CREATE TABLE IF NOT EXISTS equipment
  (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    brand         TEXT,
    model_year    TEXT,
    description   TEXT,
    price_per_day REAL,
    image_1       TEXT,
    image_1_webp  TEXT,
    image_1_jpg   TEXT,
    image_2       TEXT,
    image_2_webp  TEXT,
    image_2_jpg   TEXT,
    image_3       TEXT,
    image_3_webp  TEXT,
    image_3_jpg   TEXT,
    video         TEXT,
    created_at    TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at    TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

function addColumnIfMissing(table: string, column: string, definition: string): void {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;

    if (!cols.some((c) => c.name === column)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
}

function hasColumn(table: string, column: string): boolean {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    return cols.some((c) => c.name === column);
}

addColumnIfMissing('events', 'time', "TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('events', 'description_el', 'TEXT');
addColumnIfMissing('events', 'description_de', 'TEXT');
addColumnIfMissing('events', 'location', "TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('events', 'category', "TEXT NOT NULL DEFAULT 'general'");
addColumnIfMissing('events', 'price_members', 'REAL');
addColumnIfMissing('events', 'price_public', 'REAL');
addColumnIfMissing('events', 'sections', "TEXT NOT NULL DEFAULT '[]'");

addColumnIfMissing('links', 'logo', 'TEXT');
addColumnIfMissing('links', 'logo_webp', 'TEXT');
addColumnIfMissing('links', 'logo_jpg', 'TEXT');
addColumnIfMissing('businesses', 'logo', "TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('businesses', 'logo_webp', 'TEXT');
addColumnIfMissing('businesses', 'logo_jpg', 'TEXT');

function cleanUrl(url: unknown): string {
    return String(url || '').replace(/\?_=\d+$/, '').trim();
}

function stripHtml(html: unknown): string {
    return String(html || '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function sanitizeSmallHtml(html: unknown): string {
    return String(html || '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<video[\s\S]*?<\/video>/gi, '')
        .replace(/<audio[\s\S]*?<\/audio>/gi, '')
        .replace(/<img[^>]*>/gi, '')
        .replace(/<source[^>]*>/gi, '')
        .replace(/<(?!\/?(p|br|strong|b|em|i|u|a)(\s|>|\/))/gi, '&lt;')
        .replace(/\s(?:style|class|id|width|height|data-[^=]+|loading|decoding)="[^"]*"/gi, '')
        .replace(/\s(?:style|class|id|width|height|data-[^=]+|loading|decoding)='[^']*'/gi, '')
        .trim();
}

function inferMediaType(url: string): 'image' | 'video' | 'audio' {
    if (VIDEO_EXT.test(url)) return 'video';
    if (AUDIO_EXT.test(url)) return 'audio';
    return 'image';
}

function inferCategory(slug: string, titleEl: string, titleDe: string): string {
    const haystack = `${slug} ${titleEl} ${titleDe}`.toLowerCase();

    if (/αποκρ|party|πάρτυ|fasnacht/.test(haystack)) return 'party';
    if (/γενικ|assembly|versammlung|πίτα|pita/.test(haystack)) return 'assembly';
    if (/πασχ|ostern|εκκλη|kirche|kathara|δευτερα/.test(haystack)) return 'religion';
    if (/χορευ|dance|tanz/.test(haystack)) return 'dance';

    return 'general';
}

function dateParts(rawDate: string): { date: string; time: string } {
    const d = rawDate ? new Date(rawDate) : new Date();

    if (Number.isNaN(d.getTime())) {
        return { date: '', time: '' };
    }

    return {
        date: d.toISOString().slice(0, 10),
        time: d.toISOString().slice(11, 16)
    };
}

function collectMedia(input: {
    title_el?: string;
    title_de?: string;
    image?: string;
    content_el?: string;
    content_de?: string;
}) {
    const media: Array<{
        id: string;
        type: 'image' | 'video' | 'audio';
        url: string;
        filename: string;
        mimeType: string;
        alt: { el: string; de: string };
    }> = [];

    const seen = new Set<string>();

    function add(url: unknown) {
        const clean = cleanUrl(url);
        if (!clean || seen.has(clean)) return;
        if (!IMAGE_EXT.test(clean) && !VIDEO_EXT.test(clean) && !AUDIO_EXT.test(clean)) return;

        seen.add(clean);

        media.push({
            id: crypto.randomUUID(),
            type: inferMediaType(clean),
            url: clean,
            filename: decodeURIComponent(clean.split('/').pop()?.split('?')[0] || ''),
            mimeType: '',
            alt: {
                el: input.title_el || '',
                de: input.title_de || input.title_el || ''
            }
        });
    }

    add(input.image);

    for (const html of [input.content_el || '', input.content_de || '']) {
        for (const match of html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)) add(match[1]);
        for (const match of html.matchAll(/<(?:video|audio|source)[^>]+src=["']([^"']+)["'][^>]*>/gi)) add(match[1]);
        for (const match of html.matchAll(/https?:\/\/[^\s"'<>]+\.(?:mp4|webm|mov|m4v|mp3|wav|m4a|ogg|aac|png|jpe?g|webp|gif)(?:\?[^\s"'<>]+)?/gi)) {
            add(match[0]);
        }
    }

    return media;
}

function oldEventToSections(row: {
    title_el?: string;
    title_de?: string;
    image?: string;
    content_el?: string;
    content_de?: string;
}) {
    return [
        {
            id: crypto.randomUUID(),
            beforeHtml: {
                el: sanitizeSmallHtml(row.content_el || ''),
                de: sanitizeSmallHtml(row.content_de || '')
            },
            media: collectMedia(row),
            afterHtml: { el: '', de: '' }
        }
    ];
}

function upsertNewEventFromLegacy(input: {
    slug: string;
    date?: string;
    title_el?: string;
    title_de?: string;
    excerpt_el?: string;
    excerpt_de?: string;
    image?: string;
    content_el?: string;
    content_de?: string;
}) {
    const { date, time } = dateParts(input.date || '');
    const titleEl = input.title_el || '';
    const titleDe = input.title_de || titleEl;
    const sections = oldEventToSections(input);

    db.prepare(`
    INSERT INTO events
      (
        slug,
        date,
        time,
        title_el,
        title_de,
        description_el,
        description_de,
        location,
        category,
        price_members,
        price_public,
        sections
      )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      date = excluded.date,
      time = excluded.time,
      title_el = excluded.title_el,
      title_de = excluded.title_de,
      description_el = excluded.description_el,
      description_de = excluded.description_de,
      category = excluded.category,
      sections = excluded.sections,
      updated_at = CURRENT_TIMESTAMP
  `).run(
        input.slug,
        date,
        time,
        titleEl,
        titleDe,
        stripHtml(input.excerpt_el || '').slice(0, 360),
        stripHtml(input.excerpt_de || '').slice(0, 360),
        '',
        inferCategory(input.slug, titleEl, titleDe),
        null,
        null,
        JSON.stringify(sections)
    );
}

function migrateExistingEventRows(): void {
    const hasOldContent = hasColumn('events', 'content_el') && hasColumn('events', 'content_de');

    if (!hasOldContent) return;

    const rows = db.prepare(`
    SELECT *
    FROM events
    WHERE sections IS NULL OR sections = '' OR sections = '[]'
  `).all() as Array<any>;

    for (const row of rows) {
        upsertNewEventFromLegacy(row);
    }
}

function bootstrapFromJson(): void {
    try {
        const jsonPath = path.resolve('data/cms.json');
        if (!fs.existsSync(jsonPath)) return;

        const raw = fs.readFileSync(jsonPath, 'utf-8');
        const data = JSON.parse(raw) as Record<string, any>;

        const eventCount = (db.prepare('SELECT COUNT(*) as c FROM events').get() as { c: number } | undefined)?.c || 0;

        if (eventCount === 0) {
            for (const e of data.events || []) {
                upsertNewEventFromLegacy({
                    slug: e.slug,
                    date: e.date || '',
                    title_el: e.title?.el || '',
                    title_de: e.title?.de || e.title?.el || '',
                    excerpt_el: e.excerpt?.el || '',
                    excerpt_de: e.excerpt?.de || '',
                    image: e.image || '',
                    content_el: e.content?.el || '',
                    content_de: e.content?.de || ''
                });
            }
        }

        for (const g of data.gallery || []) {
            const gid = g.id || `g-${crypto.randomUUID()}`;

            db.prepare(`
        INSERT OR IGNORE INTO gallery_items (id, type, src, src_webp, src_jpg, alt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
                gid,
                g.type || 'image',
                g.src || '',
                g.srcVariants?.webp?.[0]?.src || '',
                g.srcVariants?.jpg?.[0]?.src || '',
                g.alt || ''
            );

            for (const tag of g.tags || []) {
                db.prepare(`INSERT INTO gallery_tags (name) VALUES (?) ON CONFLICT(name) DO NOTHING`).run(tag);

                const row = db.prepare(`SELECT id FROM gallery_tags WHERE name = ?`).get(tag) as { id: number } | undefined;

                if (row) {
                    db.prepare(`
            INSERT OR IGNORE INTO gallery_item_tags (item_id, tag_id)
            VALUES (?, ?)
          `).run(gid, row.id);
                }
            }
        }

        for (const l of data.links || []) {
            db.prepare(`
        INSERT INTO links (name_el, name_de, url, logo, logo_webp, logo_jpg)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
                l.name?.el || '',
                l.name?.de || '',
                l.url || '',
                l.logo || '',
                l.logoVariants?.webp?.[0]?.src || '',
                l.logoVariants?.jpg?.[0]?.src || ''
            );
        }

        for (const b of data.businesses || []) {
            db.prepare(`
        INSERT INTO businesses (name, url, logo, logo_webp, logo_jpg)
        VALUES (?, ?, ?, ?, ?)
      `).run(
                b.name || '',
                b.url || '',
                b.logo || '',
                b.logoVariants?.webp?.[0]?.src || '',
                b.logoVariants?.jpg?.[0]?.src || ''
            );
        }
    } catch (error) {
        console.warn('DB bootstrap from cms.json failed', error);
    }
}

migrateExistingEventRows();
bootstrapFromJson();

export function getDB() {
    return db;
}