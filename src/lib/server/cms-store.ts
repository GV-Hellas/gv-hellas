import { getDB } from '$lib/server/db';
import type { Cookies } from '@sveltejs/kit';

const db = getDB();

// --- Types ---

interface MultiLang {
  el: string;
  de: string;
}

interface ImageVariants {
  webp?: string;
  jpg?: string;
}

interface EventData {
  slug: string;
  date: string;
  title: MultiLang;
  excerpt: MultiLang;
  image: string;
  imageVariants?: ImageVariants;
  content: MultiLang;
  mediaBlocks: any[];
}

interface GalleryItem {
  id: string;
  type: string;
  src: string;
  srcVariants?: ImageVariants;
  alt: string;
  tags: string[];
}

// --- Logic ---

export function isAdminAuthenticated(cookies: Cookies): boolean {
  return cookies.get('cms_admin') === '1';
}

export function validateAdminCredentials(username: any, password: any): boolean {
  const envUser = process.env.CMS_ADMIN_USER || 'admin';
  const envPass = process.env.CMS_ADMIN_PASSWORD || 'admin123';
  return username === envUser && password === envPass;
}

function parseBlocks(value: any): any[] {
  try {
    return JSON.parse(value || '[]');
  } catch {
    return [];
  }
}

export function listEvents(): EventData[] {
  const rows = db.prepare(`SELECT * FROM events ORDER BY date DESC`).all() as any[];
  return rows.map((row) => ({
    slug: row.slug,
    date: row.date,
    title: { el: row.title_el, de: row.title_de },
    excerpt: { el: row.excerpt_el || '', de: row.excerpt_de || '' },
    image: row.image || row.image_jpg || row.image_webp || '',
    imageVariants: { webp: row.image_webp || '', jpg: row.image_jpg || '' },
    content: { el: row.content_el || '', de: row.content_de || '' },
    mediaBlocks: parseBlocks(row.media_blocks)
  }));
}

export function getEventBySlug(slug: string): EventData | null {
  const row = db.prepare(`SELECT * FROM events WHERE slug = ?`).get(slug) as any;
  if (!row) return null;
  return {
    slug: row.slug,
    date: row.date,
    title: { el: row.title_el, de: row.title_de },
    excerpt: { el: row.excerpt_el || '', de: row.excerpt_de || '' },
    image: row.image || row.image_jpg || row.image_webp || '',
    imageVariants: { webp: row.image_webp || '', jpg: row.image_jpg || '' },
    content: { el: row.content_el || '', de: row.content_de || '' },
    mediaBlocks: parseBlocks(row.media_blocks)
  };
}

export function upsertEvent(event: EventData): void {
  db.prepare(`
    INSERT INTO events (slug, date, title_el, title_de, excerpt_el, excerpt_de, image, image_webp, image_jpg, content_el, content_de, media_blocks, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(slug) DO UPDATE SET
                                  date=excluded.date,
                                  title_el=excluded.title_el,
                                  title_de=excluded.title_de,
                                  excerpt_el=excluded.excerpt_el,
                                  excerpt_de=excluded.excerpt_de,
                                  image=excluded.image,
                                  image_webp=excluded.image_webp,
                                  image_jpg=excluded.image_jpg,
                                  content_el=excluded.content_el,
                                  content_de=excluded.content_de,
                                  media_blocks=excluded.media_blocks,
                                  updated_at=CURRENT_TIMESTAMP
  `).run(
      event.slug,
      event.date,
      event.title.el,
      event.title.de,
      event.excerpt.el,
      event.excerpt.de,
      event.image,
      event.imageVariants?.webp || '',
      event.imageVariants?.jpg || '',
      event.content.el,
      event.content.de,
      JSON.stringify(event.mediaBlocks || [])
  );
}

export function deleteEvent(slug: string): void {
  db.prepare(`DELETE FROM events WHERE slug = ?`).run(slug);
}

export function listGallery(): GalleryItem[] {
  const items = db.prepare(`SELECT * FROM gallery_items ORDER BY created_at DESC`).all() as any[];
  const tagsStmt = db.prepare(`
    SELECT t.name FROM gallery_tags t
    JOIN gallery_item_tags it ON it.tag_id = t.id
    WHERE it.item_id = ?
    ORDER BY t.name
  `);

  return items.map((row) => ({
    id: row.id,
    type: row.type,
    src: row.src,
    srcVariants: { webp: row.src_webp || '', jpg: row.src_jpg || '' },
    alt: row.alt || '',
    tags: (tagsStmt.all(row.id) as any[]).map((r) => r.name)
  }));
}

export function allGalleryTags(): string[] {
  return (db.prepare(`SELECT name FROM gallery_tags ORDER BY name`).all() as any[]).map((r) => r.name);
}

export function getGalleryById(id: string): GalleryItem | null {
  return listGallery().find((item) => item.id === id) || null;
}

export function upsertGallery(item: GalleryItem): void {
  db.prepare(`
    INSERT INTO gallery_items (id, type, src, src_webp, src_jpg, alt, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      type=excluded.type,
      src=excluded.src,
      src_webp=excluded.src_webp,
      src_jpg=excluded.src_jpg,
      alt=excluded.alt,
      updated_at=CURRENT_TIMESTAMP
  `).run(
      item.id,
      item.type || 'image',
      item.src,
      item.srcVariants?.webp || '',
      item.srcVariants?.jpg || '',
      item.alt || ''
  );

  db.prepare(`DELETE FROM gallery_item_tags WHERE item_id = ?`).run(item.id);

  for (const tagName of item.tags || []) {
    if (!tagName) continue;
    db.prepare(`INSERT INTO gallery_tags (name) VALUES (?) ON CONFLICT(name) DO NOTHING`).run(tagName);

    // Fix TS18048: Cast 'tag' and check for existence
    const tag = db.prepare(`SELECT id FROM gallery_tags WHERE name = ?`).get(tagName) as { id: number } | undefined;
    if (tag) {
      db.prepare(`INSERT OR IGNORE INTO gallery_item_tags (item_id, tag_id) VALUES (?, ?)`).run(item.id, tag.id);
    }
  }
}

export function deleteGallery(id: string): void {
  db.prepare(`DELETE FROM gallery_items WHERE id = ?`).run(id);
}

export function listLinks(): { name: MultiLang, url: string }[] {
  return (db.prepare(`SELECT * FROM links ORDER BY id`).all() as any[]).map((r) => ({
    name: { el: r.name_el, de: r.name_de },
    url: r.url
  }));
}

export function listBusinesses(): { name: string, url: string }[] {
  return (db.prepare(`SELECT * FROM businesses ORDER BY id`).all() as any[]).map((r) => ({
    name: r.name,
    url: r.url
  }));
}