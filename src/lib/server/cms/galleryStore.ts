import {supabase} from '$lib/server/supabaseClient';

export type GalleryMediaType = 'image' | 'video';

export type GalleryItem = {
    id: string;
    type: GalleryMediaType;
    src480: string;
    src960: string;
    videoSrc: string;
    alt: string;
    tags: string[];
    width: number | null;
    height: number | null;
    createdAt?: string;
    updatedAt?: string;
};

type GalleryItemRow = {
    id: string;
    type: string | null;
    src_480: string | null;
    src_960: string | null;
    video_src: string | null;
    alt: string | null;
    width: number | null;
    height: number | null;
    created_at: string | null;
    updated_at: string | null;
};

type GalleryTagRow = {
    id: number;
    name: string;
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

function rowToGalleryItem(row: GalleryItemRow, tags: string[] = []): GalleryItem {
    return {
        id: row.id,
        type: normalizeType(row.type),
        src480: row.src_480 || '',
        src960: row.src_960 || '',
        videoSrc: row.video_src || '',
        alt: row.alt || '',
        tags,
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
}

async function loadTagMap() {
    const {data: tags, error: tagsError} = await supabase
        .from('gallery_tags')
        .select('id, name')
        .order('name', {ascending: true});

    if (tagsError) {
        throw formatSupabaseError('Loading gallery tags failed', tagsError);
    }

    const {data: joins, error: joinsError} = await supabase
        .from('gallery_item_tags')
        .select('item_id, tag_id');

    if (joinsError) {
        throw formatSupabaseError('Loading gallery item tags failed', joinsError);
    }

    const tagById = new Map<number, string>();

    for (const tag of (tags || []) as GalleryTagRow[]) {
        tagById.set(Number(tag.id), tag.name);
    }

    const tagsByItemId = new Map<string, string[]>();

    for (const join of (joins || []) as GalleryItemTagRow[]) {
        const tagName = tagById.get(Number(join.tag_id));

        if (!tagName) continue;

        const existing = tagsByItemId.get(join.item_id) || [];
        existing.push(tagName);
        tagsByItemId.set(join.item_id, existing);
    }

    return tagsByItemId;
}

export async function listGallery(): Promise<GalleryItem[]> {
    const {data, error} = await supabase
        .from('gallery_items')
        .select('*')
        .order('created_at', {ascending: false});

    if (error) {
        throw formatSupabaseError('Listing gallery items failed', error);
    }

    const tagMap = await loadTagMap();

    return ((data || []) as GalleryItemRow[]).map((row) =>
        rowToGalleryItem(row, tagMap.get(row.id) || [])
    );
}

export async function allGalleryTags(): Promise<string[]> {
    const {data, error} = await supabase
        .from('gallery_tags')
        .select('name')
        .order('name', {ascending: true});

    if (error) {
        throw formatSupabaseError('Listing gallery tags failed', error);
    }

    return (data || [])
        .map((row) => String(row.name || '').trim())
        .filter(Boolean);
}

export async function getGalleryById(id: string): Promise<GalleryItem | null> {
    const cleanId = String(id || '').trim();

    if (!cleanId) return null;

    const {data, error} = await supabase
        .from('gallery_items')
        .select('*')
        .eq('id', cleanId)
        .maybeSingle<GalleryItemRow>();

    if (error) {
        throw formatSupabaseError(`Loading gallery item "${cleanId}" failed`, error);
    }

    if (!data) return null;

    const tagMap = await loadTagMap();

    return rowToGalleryItem(data, tagMap.get(data.id) || []);
}

async function ensureTag(name: string) {
    const cleanName = name.trim();

    if (!cleanName) return null;

    const {data, error} = await supabase
        .from('gallery_tags')
        .upsert(
            {name: cleanName},
            {onConflict: 'name'}
        )
        .select('id, name')
        .single<GalleryTagRow>();

    if (error) {
        throw formatSupabaseError(`Saving gallery tag "${cleanName}" failed`, error);
    }

    return data;
}

async function replaceGalleryItemTags(itemId: string, tags: string[]) {
    const {error: deleteError} = await supabase
        .from('gallery_item_tags')
        .delete()
        .eq('item_id', itemId);

    if (deleteError) {
        throw formatSupabaseError(`Clearing tags for gallery item "${itemId}" failed`, deleteError);
    }

    const uniqueTags = [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];

    for (const tagName of uniqueTags) {
        const tag = await ensureTag(tagName);

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
                `Linking gallery item "${itemId}" to tag "${tagName}" failed`,
                joinError
            );
        }
    }
}

export async function upsertGallery(item: GalleryItem): Promise<GalleryItem> {
    validateGalleryItem(item);

    const id = item.id.trim();

    const row = {
        id,
        type: item.type,
        src_480: item.type === 'image' ? item.src480 || '' : '',
        src_960: item.type === 'image' ? item.src960 || item.src480 || '' : '',
        video_src: item.type === 'video' ? item.videoSrc || '' : '',
        alt: item.alt || '',
        width: item.width ?? null,
        height: item.height ?? null,
        updated_at: new Date().toISOString()
    };

    const {data, error} = await supabase
        .from('gallery_items')
        .upsert(row, {onConflict: 'id'})
        .select('*')
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