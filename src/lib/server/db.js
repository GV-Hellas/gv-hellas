import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DB_PATH = path.resolve('data/cms.db');

if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

db.exec(`
CREATE TABLE IF NOT EXISTS events (
  slug TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  title_el TEXT NOT NULL,
  title_de TEXT NOT NULL,
  excerpt_el TEXT,
  excerpt_de TEXT,
  image TEXT,
  image_webp TEXT,
  image_jpg TEXT,
  content_el TEXT,
  content_de TEXT,
  media_blocks TEXT DEFAULT '[]',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gallery_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'image',
  src TEXT NOT NULL,
  src_webp TEXT,
  src_jpg TEXT,
  alt TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gallery_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS gallery_item_tags (
  item_id TEXT NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY(item_id, tag_id),
  FOREIGN KEY(item_id) REFERENCES gallery_items(id) ON DELETE CASCADE,
  FOREIGN KEY(tag_id) REFERENCES gallery_tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name_el TEXT,
  name_de TEXT,
  url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS businesses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL
);
`);

export function getDB() {
  return db;
}


function bootstrapFromJson() {
  const eventCount = db.prepare('SELECT COUNT(*) as c FROM events').get().c;
  if (eventCount > 0) return;

  try {
    const jsonPath = path.resolve('data/cms.json');
    if (!fs.existsSync(jsonPath)) return;
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(raw);

    for (const e of data.events || []) {
      db.prepare(`INSERT INTO events (slug,date,title_el,title_de,excerpt_el,excerpt_de,image,image_webp,image_jpg,content_el,content_de,media_blocks) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        e.slug,
        e.date || '',
        e.title?.el || '',
        e.title?.de || '',
        e.excerpt?.el || '',
        e.excerpt?.de || '',
        e.image || '',
        e.imageVariants?.webp?.[0]?.src || '',
        e.imageVariants?.jpg?.[0]?.src || '',
        e.content?.el || '',
        e.content?.de || '',
        JSON.stringify(e.mediaBlocks || [])
      );
    }

    for (const g of data.gallery || []) {
      db.prepare(`INSERT INTO gallery_items (id,type,src,src_webp,src_jpg,alt) VALUES (?,?,?,?,?,?)`).run(
        g.id || `g-${Date.now()}`,
        g.type || 'image',
        g.src || '',
        g.srcVariants?.webp?.[0]?.src || '',
        g.srcVariants?.jpg?.[0]?.src || '',
        g.alt || ''
      );
      for (const tag of g.tags || []) {
        db.prepare(`INSERT INTO gallery_tags (name) VALUES (?) ON CONFLICT(name) DO NOTHING`).run(tag);
        const row = db.prepare(`SELECT id FROM gallery_tags WHERE name = ?`).get(tag);
        if (row) db.prepare(`INSERT OR IGNORE INTO gallery_item_tags (item_id, tag_id) VALUES (?, ?)`).run(g.id, row.id);
      }
    }

    for (const l of data.links || []) {
      db.prepare(`INSERT INTO links (name_el,name_de,url) VALUES (?,?,?)`).run(l.name?.el || '', l.name?.de || '', l.url || '');
    }

    for (const b of data.businesses || []) {
      db.prepare(`INSERT INTO businesses (name,url) VALUES (?,?)`).run(b.name || '', b.url || '');
    }
  } catch (error) {
    console.warn('DB bootstrap from cms.json failed', error);
  }
}

bootstrapFromJson();
