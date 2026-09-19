import {supabase} from '$lib/server/supabaseClient';
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

function formatSupabaseError(context: string, error: {message: string}) {
    return new Error(`${context}: ${error.message}`);
}

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
    const {data: tags, error: tagsError} = await supabase
        .from('gallery_tags')
        .select('id, name_el, name_de')
        .order('name_el', {ascending: true});

    if (tagsError) {
        throw formatSupabaseError('Loading gallery tags failed', tagsError);
    }

    const {data: joins, error: joinsError} = await supabase
        .from('gallery_item_tags')
        .select('item_id, tag_id');

    if (joinsError) {
        throw formatSupabaseError('Loading gallery item tags failed', joinsError);
    }

    const tagById = new Map<number, GalleryTag>();

    for (const row of (tags || []) as GalleryTagRow[]) {
        const tag = rowToGalleryTag(row);
        tagById.set(tag.id, tag);
    }

    const tagsByItemId = new Map<string, GalleryTag[]>();

    for (const join of (joins || []) as GalleryItemTagRow[]) {
        const tag = tagById.get(Number(join.tag_id));

        if (!tag) continue;

        const existing = tagsByItemId.get(join.item_id) || [];
        existing.push(tag);
        tagsByItemId.set(join.item_id, existing);
    }

    return tagsByItemId;
}

export async function listGallery(): Promise<GalleryItem[]> {
    const {data, error} = await supabase
        .from('gallery_items')
        .select('id, type, src_480, src_960, video_src, alt_el, alt_de, year, width, height, created_at, updated_at')
        .order('year', {ascending: false, nullsFirst: false})
        .order('created_at', {ascending: false});

    if (error) {
        throw formatSupabaseError('Listing gallery items failed', error);
    }

    const tagMap = await loadTagMap();

    return ((data || []) as GalleryItemRow[]).map((row) =>
        rowToGalleryItem(row, tagMap.get(row.id) || [])
    );
}

export async function allGalleryTags(): Promise<GalleryTag[]> {
    const {data, error} = await supabase
        .from('gallery_tags')
        .select('id, name_el, name_de')
        .order('name_el', {ascending: true});

    if (error) {
        throw formatSupabaseError('Listing gallery tags failed', error);
    }

    return ((data || []) as GalleryTagRow[])
        .map(rowToGalleryTag)
        .filter((tag) => tag.name.el || tag.name.de);
}

export async function getGalleryById(id: string): Promise<GalleryItem | null> {
    const cleanId = String(id || '').trim();

    if (!cleanId) return null;

    const {data, error} = await supabase
        .from('gallery_items')
        .select('id, type, src_480, src_960, video_src, alt_el, alt_de, year, width, height, created_at, updated_at')
        .eq('id', cleanId)
        .maybeSingle<GalleryItemRow>();

    if (error) {
        throw formatSupabaseError(`Loading gallery item "${cleanId}" failed`, error);
    }

    if (!data) return null;

    const tagMap = await loadTagMap();

    return rowToGalleryItem(data, tagMap.get(data.id) || []);
}

function normalizeTagInput(tag: Omit<GalleryTag, 'id'> | GalleryTag): GalleryLocalizedText | null {
    const name = localizedText(tag.name?.el, tag.name?.de);

    if (!name.el && !name.de) return null;

    return name;
}

async function ensureTag(input: Omit<GalleryTag, 'id'> | GalleryTag) {
    const name = normalizeTagInput(input);

    if (!name) return null;

    const {data, error} = await supabase
        .from('gallery_tags')
        .upsert(
            {
                name_el: name.el,
                name_de: name.de,
                // Keep the legacy column unique during the transition while the
                // bilingual pair becomes the canonical identity.
                name: name.el === name.de ? name.el : `${name.el} / ${name.de}`
            },
            {onConflict: 'name_el,name_de'}
        )
        .select('id, name_el, name_de')
        .single<GalleryTagRow>();

    if (error) {
        throw formatSupabaseError(`Saving gallery tag "${name.el || name.de}" failed`, error);
    }

    return data;
}

async function replaceGalleryItemTags(itemId: string, tags: GalleryTag[]) {
    const {error: deleteError} = await supabase
        .from('gallery_item_tags')
        .delete()
        .eq('item_id', itemId);

    if (deleteError) {
        throw formatSupabaseError(`Clearing tags for gallery item "${itemId}" failed`, deleteError);
    }

    const unique = new Map<string, GalleryTag>();

    for (const tag of tags) {
        const name = normalizeTagInput(tag);
        if (!name) continue;

        unique.set(`${name.el.toLocaleLowerCase()}\u0000${name.de.toLocaleLowerCase()}`, {
            id: tag.id || 0,
            name
        });
    }

    for (const tagInput of unique.values()) {
        const tag = await ensureTag(tagInput);

        if (!tag?.id) continue;

        const {error: joinError} = await supabase
            .from('gallery_item_tags')
            .upsert(
                {
                    item_id: itemId,
                    tag_id: tag.id
                },
                {
                    onConflict: 'item_id,tag_id'
                }
            );

        if (joinError) {
            throw formatSupabaseError(
                `Linking gallery item "${itemId}" to tag "${tag.name_el || tag.name_de}" failed`,
                joinError
            );
        }
    }
}

export async function upsertGallery(item: GalleryItem): Promise<GalleryItem> {
    validateGalleryItem(item);

    const id = item.id.trim();
    const normalizedAlt = localizedText(item.alt?.el, item.alt?.de);

    const row = {
        id,
        type: item.type,
        src_480: item.type === 'image' ? item.src480 || '' : '',
        src_960: item.type === 'image' ? item.src960 || item.src480 || '' : '',
        video_src: item.type === 'video' ? item.videoSrc || '' : '',
        alt_el: normalizedAlt.el,
        alt_de: normalizedAlt.de,
        // Keep the legacy field populated until it is intentionally removed from Supabase.
        alt: normalizedAlt.el || normalizedAlt.de,
        year: item.year,
        width: item.width ?? null,
        height: item.height ?? null,
        updated_at: new Date().toISOString()
    };

    const {data, error} = await supabase
        .from('gallery_items')
        .upsert(row, {onConflict: 'id'})
        .select('id, type, src_480, src_960, video_src, alt_el, alt_de, year, width, height, created_at, updated_at')
        .single<GalleryItemRow>();

    if (error) {
        throw formatSupabaseError(`Saving gallery item "${id}" failed`, error);
    }

    await replaceGalleryItemTags(id, item.tags || []);

    return rowToGalleryItem(data, item.tags || []);
}

export async function deleteGallery(id: string): Promise<boolean> {
    const cleanId = String(id || '').trim();

    if (!cleanId) return false;

    const {error, count} = await supabase
        .from('gallery_items')
        .delete({count: 'exact'})
        .eq('id', cleanId);

    if (error) {
        throw formatSupabaseError(`Deleting gallery item "${cleanId}" failed`, error);
    }

    return (count ?? 0) > 0;
}
