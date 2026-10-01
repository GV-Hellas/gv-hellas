import {getSql} from '$lib/server/neonClient';
import type {
    GalleryItem,
    GalleryLocalizedText,
    GalleryMediaType,
    GalleryTag
} from '$lib/cms/gallery/types';

export type {GalleryItem, GalleryLocalizedText, GalleryMediaType, GalleryTag};

type GalleryItemRow = {
    id: string;
    type: string | null;
    src_480: string | null;
    src_960: string | null;
    video_src: string | null;
    alt_el: string | null;
    alt_de: string | null;
    year: number | null;
    width: number | null;
    height: number | null;
    created_at: string | null;
    updated_at: string | null;
};

type GalleryTagRow = {
    id: number;
    name_el: string | null;
    name_de: string | null;
};

type GalleryItemTagRow = {
    item_id: string;
    tag_id: number;
};

function normalizeType(value: unknown): GalleryMediaType {
    return value === 'video' ? 'video' : 'image';
}

function localizedText(el: unknown, de: unknown): GalleryLocalizedText {
    const greek = String(el || '').trim();
    const german = String(de || '').trim();

    return {
        el: greek || german,
        de: german || greek
    };
}

function rowToGalleryTag(row: GalleryTagRow): GalleryTag {
    return {
        id: Number(row.id),
        name: localizedText(row.name_el, row.name_de)
    };
}

function rowToGalleryItem(row: GalleryItemRow, tags: GalleryTag[] = []): GalleryItem {
    return {
        id: row.id,
        type: normalizeType(row.type),
        src480: row.src_480 || '',
        src960: row.src_960 || '',
        videoSrc: row.video_src || '',
        alt: localizedText(row.alt_el, row.alt_de),
        tags,
        year: Number.isInteger(row.year) ? Number(row.year) : null,
        width: row.width ?? null,
        height: row.height ?? null,
        createdAt: row.created_at || undefined,
        updatedAt: row.updated_at || undefined
    };
}

function validateGalleryItem(item: GalleryItem) {
    if (!item.id.trim()) {
        throw new Error('Gallery item id is required');
    }

    if (item.type === 'image' && !item.src480 && !item.src960) {
        throw new Error('Gallery image requires src480 or src960');
    }

    if (item.type === 'video' && !item.videoSrc) {
        throw new Error('Gallery video requires videoSrc');
    }

    if (item.year !== null && (!Number.isInteger(item.year) || item.year < 1800 || item.year > 2200)) {
        throw new Error('Gallery year is invalid');
    }
}


async function loadTagMap() {
    const rows = await getSql()`
        SELECT j.item_id, t.id, t.name_el, t.name_de
        FROM gallery_item_tags j
        JOIN gallery_tags t ON t.id = j.tag_id
        ORDER BY t.name_el ASC
    `;
    const map = new Map<string, GalleryTag[]>();
    for (const row of rows) {
        const itemId=String(row.item_id); const tag=rowToGalleryTag(row as unknown as GalleryTagRow);
        const current=map.get(itemId)||[]; current.push(tag); map.set(itemId,current);
    }
    return map;
}
export async function listGallery():Promise<GalleryItem[]>{const rows=await getSql()`SELECT id,type,src_480,src_960,video_src,alt_el,alt_de,year,width,height,created_at,updated_at FROM gallery_items ORDER BY year DESC NULLS LAST,created_at DESC`;const tags=await loadTagMap();return rows.map(r=>rowToGalleryItem(r as GalleryItemRow,tags.get(String(r.id))||[]))}
export async function allGalleryTags():Promise<GalleryTag[]>{const rows=await getSql()`SELECT id,name_el,name_de FROM gallery_tags ORDER BY name_el`;return rows.map(r=>rowToGalleryTag(r as GalleryTagRow)).filter(t=>t.name.el||t.name.de)}
export async function getGalleryById(id:string):Promise<GalleryItem|null>{const clean=String(id||'').trim();if(!clean)return null;const rows=await getSql()`SELECT id,type,src_480,src_960,video_src,alt_el,alt_de,year,width,height,created_at,updated_at FROM gallery_items WHERE id=${clean} LIMIT 1`;if(!rows[0])return null;const tags=await loadTagMap();return rowToGalleryItem(rows[0] as GalleryItemRow,tags.get(clean)||[])}
function normalizeTagInput(tag:Omit<GalleryTag,'id'>|GalleryTag):GalleryLocalizedText|null{const name=localizedText(tag.name?.el,tag.name?.de);return !name.el&&!name.de?null:name}
async function ensureTag(input:Omit<GalleryTag,'id'>|GalleryTag){const name=normalizeTagInput(input);if(!name)return null;const legacy=name.el===name.de?name.el:`${name.el} / ${name.de}`;const rows=await getSql()`INSERT INTO gallery_tags(name_el,name_de,name) VALUES(${name.el},${name.de},${legacy}) ON CONFLICT(name_el,name_de) DO UPDATE SET name=EXCLUDED.name RETURNING id,name_el,name_de`;return rows[0] as unknown as GalleryTagRow}
async function replaceGalleryItemTags(itemId:string,tags:GalleryTag[]){await getSql()`DELETE FROM gallery_item_tags WHERE item_id=${itemId}`;const unique=new Map<string,GalleryTag>();for(const tag of tags){const name=normalizeTagInput(tag);if(!name)continue;unique.set(`${name.el.toLocaleLowerCase()}\u0000${name.de.toLocaleLowerCase()}`,{id:tag.id||0,name})}for(const input of unique.values()){const tag=await ensureTag(input);if(!tag?.id)continue;await getSql()`INSERT INTO gallery_item_tags(item_id,tag_id) VALUES(${itemId},${tag.id}) ON CONFLICT(item_id,tag_id) DO NOTHING`}}
export async function upsertGallery(item:GalleryItem):Promise<GalleryItem>{validateGalleryItem(item);const id=item.id.trim();const alt=localizedText(item.alt?.el,item.alt?.de);const rows=await getSql()`INSERT INTO gallery_items(id,type,src_480,src_960,video_src,alt_el,alt_de,alt,year,width,height,updated_at) VALUES(${id},${item.type},${item.type==='image'?item.src480||'':''},${item.type==='image'?item.src960||item.src480||'':''},${item.type==='video'?item.videoSrc||'':''},${alt.el},${alt.de},${alt.el||alt.de},${item.year},${item.width??null},${item.height??null},NOW()) ON CONFLICT(id) DO UPDATE SET type=EXCLUDED.type,src_480=EXCLUDED.src_480,src_960=EXCLUDED.src_960,video_src=EXCLUDED.video_src,alt_el=EXCLUDED.alt_el,alt_de=EXCLUDED.alt_de,alt=EXCLUDED.alt,year=EXCLUDED.year,width=EXCLUDED.width,height=EXCLUDED.height,updated_at=NOW() RETURNING id,type,src_480,src_960,video_src,alt_el,alt_de,year,width,height,created_at,updated_at`;await replaceGalleryItemTags(id,item.tags||[]);return rowToGalleryItem(rows[0] as GalleryItemRow,item.tags||[])}
export async function deleteGallery(id:string):Promise<boolean>{const clean=String(id||'').trim();if(!clean)return false;return (await getSql()`DELETE FROM gallery_items WHERE id=${clean} RETURNING id`).length>0}
