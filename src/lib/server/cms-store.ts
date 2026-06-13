import {getDB} from '$lib/server/db';
import type {Cookies} from '@sveltejs/kit';

const db = getDB();

type MultiLang = { el: string; de: string };
type Variants = { webp?: string; jpg?: string };

type GalleryItem = {
    id: string;
    type: string;
    src: string;
    srcVariants: Variants;
    alt: string;
    tags: string[];
};

type LinkItem = { id?: number; name: MultiLang; url: string; logo: string; logoVariants: Variants };
type BusinessItem = { id?: number; name: string; url: string; logo: string; logoVariants: Variants };
type EquipmentImage = { src: string; variants: Variants };
type EquipmentItem = {
    id?: number;
    name: string;
    brand: string;
    modelYear: string;
    description: string;
    pricePerDay: number;
    video: string;
    images: EquipmentImage[];
};

export function isAdminAuthenticated(cookies: Cookies): boolean {
    return cookies.get('cms_admin') === '1';
}

export function validateAdminCredentials(username: string, password: string): boolean {
    const envUser = process.env.CMS_ADMIN_USER || 'admin';
    const envPass = process.env.CMS_ADMIN_PASSWORD || 'admin123';
    return username === envUser && password === envPass;
}

function parseBlocks(value: string): unknown[] {
    try {
        return JSON.parse(value || '[]') as unknown[];
    } catch {
        return [];
    }
}

function parseVariants(row: Record<string, unknown>, base: string): Variants {
    return {webp: String(row[`${base}_webp`] || ''), jpg: String(row[`${base}_jpg`] || '')};
}

export function listGallery(): GalleryItem[] {
    const items = db.prepare(`SELECT *
                              FROM gallery_items
                              ORDER BY created_at DESC`).all() as any[];
    const tagsStmt = db.prepare(`
        SELECT t.name
        FROM gallery_tags t
                 JOIN gallery_item_tags it ON it.tag_id = t.id
        WHERE it.item_id = ?
        ORDER BY t.name ASC
    `);

    return items.map((row) => ({
        id: row.id,
        type: row.type,
        src: row.src,
        srcVariants: parseVariants(row, 'src'),
        alt: row.alt || '',
        tags: (tagsStmt.all(row.id) as Array<{ name: string }>).map((r) => r.name)
    }));
}

export function allGalleryTags(): string[] {
    return (db.prepare(`SELECT name
                        FROM gallery_tags
                        ORDER BY name`).all() as Array<{ name: string }>).map((r) => r.name);
}

export function getGalleryById(id: string): GalleryItem | null {
    return listGallery().find((item) => item.id === id) || null;
}

export function upsertGallery(item: GalleryItem): void {
    db.prepare(`
        INSERT INTO gallery_items (id, type, src, src_webp, src_jpg, alt, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET type=excluded.type,
                                      src=excluded.src,
                                      src_webp=excluded.src_webp,
                                      src_jpg=excluded.src_jpg,
                                      alt=excluded.alt,
                                      updated_at=CURRENT_TIMESTAMP
    `).run(item.id, item.type || 'image', item.src, item.srcVariants?.webp || '', item.srcVariants?.jpg || '', item.alt || '');

    db.prepare(`DELETE
                FROM gallery_item_tags
                WHERE item_id = ?`).run(item.id);
    for (const tagName of item.tags || []) {
        if (!tagName) continue;
        db.prepare(`INSERT INTO gallery_tags (name)
                    VALUES (?)
                    ON CONFLICT(name) DO NOTHING`).run(tagName);
        const tag = db.prepare(`SELECT id
                                FROM gallery_tags
                                WHERE name = ?`).get(tagName) as { id: number } | undefined;
        if (tag?.id) {
            db.prepare(`INSERT OR IGNORE INTO gallery_item_tags (item_id, tag_id)
                        VALUES (?, ?)`).run(item.id, tag.id);
        }
    }
}

export function deleteGallery(id: string): void {
    db.prepare(`DELETE
                FROM gallery_items
                WHERE id = ?`).run(id);
}

export function listLinks(): LinkItem[] {
    return (db.prepare(`SELECT *
                        FROM links
                        ORDER BY id`).all() as any[]).map((r) => ({
        id: r.id,
        name: {el: r.name_el, de: r.name_de},
        url: r.url,
        logo: r.logo || '',
        logoVariants: parseVariants(r, 'logo')
    }));
}

export function getLinkById(id: number): LinkItem | null {
    return listLinks().find((item) => item.id === id) || null;
}

export function upsertLink(link: LinkItem): void {
    if (link.id) {
        db.prepare(`
            UPDATE links
            SET name_el   = ?,
                name_de   = ?,
                url       = ?,
                logo      = ?,
                logo_webp = ?,
                logo_jpg  = ?
            WHERE id = ?
        `).run(link.name.el, link.name.de, link.url, link.logo || '', link.logoVariants?.webp || '', link.logoVariants?.jpg || '', link.id);
        return;
    }

    db.prepare(`INSERT INTO links (name_el, name_de, url, logo, logo_webp, logo_jpg)
                VALUES (?, ?, ?, ?, ?, ?)`)
        .run(link.name.el, link.name.de, link.url, link.logo || '', link.logoVariants?.webp || '', link.logoVariants?.jpg || '');
}

export function deleteLink(id: number): void {
    db.prepare(`DELETE
                FROM links
                WHERE id = ?`).run(id);
}

export function listBusinesses(): BusinessItem[] {
    return (db.prepare(`SELECT *
                        FROM businesses
                        ORDER BY id`).all() as any[]).map((r) => ({
        id: r.id,
        name: r.name,
        url: r.url,
        logo: r.logo || '',
        logoVariants: parseVariants(r, 'logo')
    }));
}

export function getBusinessById(id: number): BusinessItem | null {
    return listBusinesses().find((item) => item.id === id) || null;
}

export function upsertBusiness(item: BusinessItem): void {
    if (item.id) {
        db.prepare(`UPDATE businesses
                    SET name      = ?,
                        url       = ?,
                        logo      = ?,
                        logo_webp = ?,
                        logo_jpg  = ?
                    WHERE id = ?`)
            .run(item.name, item.url, item.logo, item.logoVariants?.webp || '', item.logoVariants?.jpg || '', item.id);
        return;
    }

    db.prepare(`INSERT INTO businesses (name, url, logo, logo_webp, logo_jpg)
                VALUES (?, ?, ?, ?, ?)`)
        .run(item.name, item.url, item.logo, item.logoVariants?.webp || '', item.logoVariants?.jpg || '');
}

export function deleteBusiness(id: number): void {
    db.prepare(`DELETE
                FROM businesses
                WHERE id = ?`).run(id);
}

export function listEquipment(): EquipmentItem[] {
    return (db.prepare(`SELECT *
                        FROM equipment
                        ORDER BY created_at DESC`).all() as any[]).map((r) => ({
        id: r.id,
        name: r.name,
        brand: r.brand || '',
        modelYear: r.model_year || '',
        description: r.description || '',
        pricePerDay: Number(r.price_per_day || 0),
        video: r.video || '',
        images: [
            {src: r.image_1 || '', variants: {webp: r.image_1_webp || '', jpg: r.image_1_jpg || ''}},
            {src: r.image_2 || '', variants: {webp: r.image_2_webp || '', jpg: r.image_2_jpg || ''}},
            {src: r.image_3 || '', variants: {webp: r.image_3_webp || '', jpg: r.image_3_jpg || ''}}
        ].filter((img) => img.src)
    }));
}

export function getEquipmentById(id: number): EquipmentItem | null {
    return listEquipment().find((item) => item.id === id) || null;
}

export function upsertEquipment(item: EquipmentItem): void {
    const img1 = item.images?.[0] || ({src: '', variants: {}} as EquipmentImage);
    const img2 = item.images?.[1] || ({src: '', variants: {}} as EquipmentImage);
    const img3 = item.images?.[2] || ({src: '', variants: {}} as EquipmentImage);

    if (item.id) {
        db.prepare(`
            UPDATE equipment
            SET name          = ?,
                brand         = ?,
                model_year    = ?,
                description   = ?,
                price_per_day = ?,
                image_1       = ?,
                image_1_webp  = ?,
                image_1_jpg   = ?,
                image_2       = ?,
                image_2_webp  = ?,
                image_2_jpg   = ?,
                image_3       = ?,
                image_3_webp  = ?,
                image_3_jpg   = ?,
                video         = ?,
                updated_at    = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            item.name,
            item.brand || '',
            item.modelYear || '',
            item.description || '',
            Number(item.pricePerDay || 0),
            img1.src || '', img1.variants?.webp || '', img1.variants?.jpg || '',
            img2.src || '', img2.variants?.webp || '', img2.variants?.jpg || '',
            img3.src || '', img3.variants?.webp || '', img3.variants?.jpg || '',
            item.video || '',
            item.id
        );
        return;
    }

    db.prepare(`
        INSERT INTO equipment (name, brand, model_year, description, price_per_day,
                               image_1, image_1_webp, image_1_jpg,
                               image_2, image_2_webp, image_2_jpg,
                               image_3, image_3_webp, image_3_jpg,
                               video)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        item.name,
        item.brand || '',
        item.modelYear || '',
        item.description || '',
        Number(item.pricePerDay || 0),
        img1.src || '', img1.variants?.webp || '', img1.variants?.jpg || '',
        img2.src || '', img2.variants?.webp || '', img2.variants?.jpg || '',
        img3.src || '', img3.variants?.webp || '', img3.variants?.jpg || '',
        item.video || ''
    );
}

export function deleteEquipment(id: number): void {
    db.prepare(`DELETE
                FROM equipment
                WHERE id = ?`).run(id);
}
