import {env} from '$env/dynamic/private';
import {getDB} from '$lib/server/db';
import {slugify} from '$lib/utils';
import type {Cookies} from '@sveltejs/kit';

type MultiLang = {el: string; de: string};
type Variants = {webp?: string; jpg?: string};

type GalleryItem = {
    id: string;
    type: string;
    src: string;
    srcVariants: Variants;
    alt: string;
    tags: string[];
};

type LinkItem = {
    id?: number;
    name: MultiLang;
    descriptionHtml?: MultiLang;
    url: string;
    logo: string;
    logoVariants: Variants;
};

type BusinessItem = {
    id?: number;
    sponsorType?: string;
    name: string;
    slug?: string;
    url: string;
    logo: string;
    logoVariants: Variants;
};

type EquipmentImage = {
    src: string;
    variants: Variants;
};

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

function formatSupabaseError(context: string, error: {message: string}) {
    return new Error(`${context}: ${error.message}`);
}

function nowIso() {
    return new Date().toISOString();
}

function parseVariants(row: Record<string, unknown>, base: string): Variants {
    return {
        webp: String(row[`${base}_webp`] || ''),
        jpg: String(row[`${base}_jpg`] || '')
    };
}

function safeSlug(value: string) {
    return value
        .trim()
        .replace(/\.json$/i, '')
        .replaceAll('/', '')
        .replaceAll('\\', '');
}

function normalizeBusinessSlug(value: string) {
    return safeSlug(slugify(value));
}

function tagNameFromJoin(row: Record<string, unknown>) {
    const relation = row.gallery_tags as {name?: string} | {name?: string}[] | null | undefined;

    if (Array.isArray(relation)) {
        return relation[0]?.name || '';
    }

    return relation?.name || '';
}

export function isAdminAuthenticated(cookies: Cookies): boolean {
    return cookies.get('cms_admin') === '1';
}

export function validateAdminCredentials(username: string, password: string): boolean {
    const envUser = env.CMS_ADMIN_USER || 'admin';
    const envPass = env.CMS_ADMIN_PASSWORD || 'admin123';

    return username === envUser && password === envPass;
}

/* Gallery */

export async function listGallery(): Promise<GalleryItem[]> {
    const supabase = await getDB();

    const {data: items, error: itemError} = await supabase
        .from('gallery_items')
        .select('*')
        .order('created_at', {
            ascending: false
        });

    if (itemError) {
        throw formatSupabaseError('Listing gallery items failed', itemError);
    }

    const {data: joins, error: joinError} = await supabase
        .from('gallery_item_tags')
        .select('item_id, gallery_tags(name)');

    if (joinError) {
        throw formatSupabaseError('Listing gallery item tags failed', joinError);
    }

    const tagMap = new Map<string, string[]>();

    for (const row of joins || []) {
        const itemId = String((row as Record<string, unknown>).item_id || '');
        const tagName = tagNameFromJoin(row as Record<string, unknown>);

        if (!itemId || !tagName) continue;

        const existing = tagMap.get(itemId) || [];
        existing.push(tagName);
        tagMap.set(itemId, existing);
    }

    return (items || []).map((row) => {
        const r = row as Record<string, unknown>;

        return {
            id: String(r.id || ''),
            type: String(r.type || 'image'),
            src: String(r.src || ''),
            srcVariants: parseVariants(r, 'src'),
            alt: String(r.alt || ''),
            tags: tagMap.get(String(r.id || '')) || []
        };
    });
}

export async function allGalleryTags(): Promise<string[]> {
    const supabase = await getDB();

    const {data, error} = await supabase
        .from('gallery_tags')
        .select('name')
        .order('name', {
            ascending: true
        });

    if (error) {
        throw formatSupabaseError('Listing gallery tags failed', error);
    }

    return (data || []).map((row) => String(row.name || '')).filter(Boolean);
}

export async function getGalleryById(id: string): Promise<GalleryItem | null> {
    const items = await listGallery();

    return items.find((item) => item.id === id) || null;
}

export async function upsertGallery(item: GalleryItem): Promise<void> {
    const supabase = await getDB();

    const {error: itemError} = await supabase
        .from('gallery_items')
        .upsert(
            {
                id: item.id,
                type: item.type || 'image',
                src: item.src || '',
                src_webp: item.srcVariants?.webp || '',
                src_jpg: item.srcVariants?.jpg || '',
                alt: item.alt || '',
                updated_at: nowIso()
            },
            {
                onConflict: 'id'
            }
        );

    if (itemError) {
        throw formatSupabaseError(`Saving gallery item "${item.id}" failed`, itemError);
    }

    const {error: deleteError} = await supabase
        .from('gallery_item_tags')
        .delete()
        .eq('item_id', item.id);

    if (deleteError) {
        throw formatSupabaseError(`Clearing gallery tags for "${item.id}" failed`, deleteError);
    }

    for (const tagName of item.tags || []) {
        const cleanTag = String(tagName || '').trim();

        if (!cleanTag) continue;

        const {data: tag, error: tagError} = await supabase
            .from('gallery_tags')
            .upsert(
                {
                    name: cleanTag
                },
                {
                    onConflict: 'name'
                }
            )
            .select('id')
            .single();

        if (tagError) {
            throw formatSupabaseError(`Saving gallery tag "${cleanTag}" failed`, tagError);
        }

        const tagId = Number(tag?.id);

        if (!tagId) continue;

        const {error: joinError} = await supabase
            .from('gallery_item_tags')
            .upsert(
                {
                    item_id: item.id,
                    tag_id: tagId
                },
                {
                    onConflict: 'item_id,tag_id'
                }
            );

        if (joinError) {
            throw formatSupabaseError(`Linking gallery tag "${cleanTag}" failed`, joinError);
        }
    }
}

export async function deleteGallery(id: string): Promise<boolean> {
    const supabase = await getDB();

    const {error, count} = await supabase
        .from('gallery_items')
        .delete({
            count: 'exact'
        })
        .eq('id', id);

    if (error) {
        throw formatSupabaseError(`Deleting gallery item "${id}" failed`, error);
    }

    return (count ?? 0) > 0;
}

/* Links */

export async function listLinks(): Promise<LinkItem[]> {
    const supabase = await getDB();

    const {data, error} = await supabase
        .from('links')
        .select('*')
        .order('id', {
            ascending: true
        });

    if (error) {
        throw formatSupabaseError('Listing links failed', error);
    }

    return (data || []).map((row) => {
        const r = row as Record<string, unknown>;

        return {
            id: Number(r.id),
            name: {
                el: String(r.name_el || ''),
                de: String(r.name_de || '')
            },
            descriptionHtml: {
                el: String(r.description_html_el || ''),
                de: String(r.description_html_de || '')
            },
            url: String(r.url || ''),
            logo: String(r.logo || r.logo_webp || r.logo_jpg || ''),
            logoVariants: {
                webp: String(r.logo_webp || r.logo || ''),
                jpg: String(r.logo_jpg || '')
            }
        };
    });
}

export async function getLinkById(id: number): Promise<LinkItem | null> {
    if (!Number.isFinite(id)) return null;

    const supabase = await getDB();

    const {data, error} = await supabase
        .from('links')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) {
        throw formatSupabaseError(`Loading link "${id}" failed`, error);
    }

    if (!data) return null;

    const row = data as Record<string, unknown>;

    return {
        id: Number(row.id),
        name: {
            el: String(row.name_el || ''),
            de: String(row.name_de || '')
        },
        descriptionHtml: {
            el: String(row.description_html_el || ''),
            de: String(row.description_html_de || '')
        },
        url: String(row.url || ''),
        logo: String(row.logo || row.logo_webp || row.logo_jpg || ''),
        logoVariants: {
            webp: String(row.logo_webp || row.logo || ''),
            jpg: String(row.logo_jpg || '')
        }
    };
}

export async function upsertLink(link: LinkItem): Promise<LinkItem> {
    const supabase = await getDB();

    const row = {
        name_el: link.name.el || '',
        name_de: link.name.de || '',
        description_html_el: link.descriptionHtml?.el || '',
        description_html_de: link.descriptionHtml?.de || '',
        url: link.url,
        logo: link.logo || link.logoVariants?.webp || '',
        logo_webp: link.logoVariants?.webp || link.logo || '',
        logo_jpg: link.logoVariants?.jpg || '',
        updated_at: nowIso()
    };

    if (link.id) {
        const {data, error} = await supabase
            .from('links')
            .update(row)
            .eq('id', link.id)
            .select('*')
            .single();

        if (error) {
            throw formatSupabaseError(`Updating link "${link.id}" failed`, error);
        }

        return {
            id: Number(data.id),
            name: {
                el: data.name_el || '',
                de: data.name_de || ''
            },
            descriptionHtml: {
                el: data.description_html_el || '',
                de: data.description_html_de || ''
            },
            url: data.url || '',
            logo: data.logo || data.logo_webp || '',
            logoVariants: {
                webp: data.logo_webp || data.logo || '',
                jpg: data.logo_jpg || ''
            }
        };
    }

    const {data, error} = await supabase
        .from('links')
        .upsert(row, {
            onConflict: 'url'
        })
        .select('*')
        .single();

    if (error) {
        throw formatSupabaseError(`Saving link "${link.url}" failed`, error);
    }

    return {
        id: Number(data.id),
        name: {
            el: data.name_el || '',
            de: data.name_de || ''
        },
        descriptionHtml: {
            el: data.description_html_el || '',
            de: data.description_html_de || ''
        },
        url: data.url || '',
        logo: data.logo || data.logo_webp || '',
        logoVariants: {
            webp: data.logo_webp || data.logo || '',
            jpg: data.logo_jpg || ''
        }
    };
}

export async function deleteLink(id: number): Promise<boolean> {
    if (!Number.isFinite(id)) return false;

    const supabase = await getDB();

    const {error, count} = await supabase
        .from('links')
        .delete({
            count: 'exact'
        })
        .eq('id', id);

    if (error) {
        throw formatSupabaseError(`Deleting link "${id}" failed`, error);
    }

    return (count ?? 0) > 0;
}

/* Businesses */

async function businessSlugExists(slug: string, exceptId?: number): Promise<boolean> {
    const supabase = await getDB();

    let query = supabase
        .from('businesses')
        .select('id')
        .eq('slug', slug)
        .limit(1);

    if (exceptId) {
        query = query.neq('id', exceptId);
    }

    const {data, error} = await query;

    if (error) {
        throw formatSupabaseError(`Checking business slug "${slug}" failed`, error);
    }

    return (data || []).length > 0;
}

async function uniqueBusinessSlug(baseSlug: string, exceptId?: number): Promise<string> {
    const cleanBase = safeSlug(baseSlug) || `business-${crypto.randomUUID()}`;
    let candidate = cleanBase;
    let counter = 2;

    while (await businessSlugExists(candidate, exceptId)) {
        candidate = `${cleanBase}-${counter}`;
        counter += 1;
    }

    return candidate;
}

export async function listBusinesses(): Promise<BusinessItem[]> {
    const supabase = await getDB();

    const {data, error} = await supabase
        .from('businesses')
        .select('*')
        .order('name', {
            ascending: true
        });

    if (error) {
        throw formatSupabaseError('Listing businesses failed', error);
    }

    return (data || []).map((row) => {
        const r = row as Record<string, unknown>;

        return {
            id: Number(r.id),
            sponsorType: String(r.sponsor_type || 'listed'),
            name: String(r.name || ''),
            slug: String(r.slug || ''),
            url: String(r.url || ''),
            logo: String(r.logo || r.logo_webp || r.logo_jpg || ''),
            logoVariants: {
                webp: String(r.logo_webp || r.logo || ''),
                jpg: String(r.logo_jpg || '')
            }
        };
    });
}

export async function getBusinessById(id: number): Promise<BusinessItem | null> {
    if (!Number.isFinite(id)) return null;

    const supabase = await getDB();

    const {data, error} = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) {
        throw formatSupabaseError(`Loading business "${id}" failed`, error);
    }

    if (!data) return null;

    return {
        id: Number(data.id),
        sponsorType: data.sponsor_type || 'listed',
        name: data.name || '',
        slug: data.slug || '',
        url: data.url || '',
        logo: data.logo || data.logo_webp || data.logo_jpg || '',
        logoVariants: {
            webp: data.logo_webp || data.logo || '',
            jpg: data.logo_jpg || ''
        }
    };
}

export async function upsertBusiness(item: BusinessItem): Promise<BusinessItem> {
    const supabase = await getDB();

    const existing = item.id ? await getBusinessById(item.id) : null;
    const baseSlug = existing?.slug || item.slug || normalizeBusinessSlug(item.name);
    const slug = existing?.slug || await uniqueBusinessSlug(baseSlug, item.id);

    const row = {
        sponsor_type: item.sponsorType || 'listed',
        name: item.name || '',
        slug,
        url: item.url || '',
        logo: item.logo || item.logoVariants?.webp || '',
        logo_webp: item.logoVariants?.webp || item.logo || '',
        logo_jpg: item.logoVariants?.jpg || '',
        updated_at: nowIso()
    };

    if (item.id) {
        const {data, error} = await supabase
            .from('businesses')
            .update(row)
            .eq('id', item.id)
            .select('*')
            .single();

        if (error) {
            throw formatSupabaseError(`Updating business "${item.id}" failed`, error);
        }

        return {
            id: Number(data.id),
            sponsorType: data.sponsor_type || 'listed',
            name: data.name || '',
            slug: data.slug || '',
            url: data.url || '',
            logo: data.logo || data.logo_webp || '',
            logoVariants: {
                webp: data.logo_webp || data.logo || '',
                jpg: data.logo_jpg || ''
            }
        };
    }

    const {data, error} = await supabase
        .from('businesses')
        .insert(row)
        .select('*')
        .single();

    if (error) {
        throw formatSupabaseError(`Creating business "${item.name}" failed`, error);
    }

    return {
        id: Number(data.id),
        sponsorType: data.sponsor_type || 'listed',
        name: data.name || '',
        slug: data.slug || '',
        url: data.url || '',
        logo: data.logo || data.logo_webp || '',
        logoVariants: {
            webp: data.logo_webp || data.logo || '',
            jpg: data.logo_jpg || ''
        }
    };
}

export async function deleteBusiness(id: number): Promise<boolean> {
    if (!Number.isFinite(id)) return false;

    const supabase = await getDB();

    const {error, count} = await supabase
        .from('businesses')
        .delete({
            count: 'exact'
        })
        .eq('id', id);

    if (error) {
        throw formatSupabaseError(`Deleting business "${id}" failed`, error);
    }

    return (count ?? 0) > 0;
}

/* Equipment */

export async function listEquipment(): Promise<EquipmentItem[]> {
    const supabase = await getDB();

    const {data, error} = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', {
            ascending: false
        });

    if (error) {
        throw formatSupabaseError('Listing equipment failed', error);
    }

    return (data || []).map((row) => {
        const r = row as Record<string, unknown>;

        return {
            id: Number(r.id),
            name: String(r.name || ''),
            brand: String(r.brand || ''),
            modelYear: String(r.model_year || ''),
            description: String(r.description || ''),
            pricePerDay: Number(r.price_per_day || 0),
            video: String(r.video || ''),
            images: [
                {
                    src: String(r.image_1 || ''),
                    variants: {
                        webp: String(r.image_1_webp || ''),
                        jpg: String(r.image_1_jpg || '')
                    }
                },
                {
                    src: String(r.image_2 || ''),
                    variants: {
                        webp: String(r.image_2_webp || ''),
                        jpg: String(r.image_2_jpg || '')
                    }
                },
                {
                    src: String(r.image_3 || ''),
                    variants: {
                        webp: String(r.image_3_webp || ''),
                        jpg: String(r.image_3_jpg || '')
                    }
                }
            ].filter((image) => image.src)
        };
    });
}

export async function getEquipmentById(id: number): Promise<EquipmentItem | null> {
    const items = await listEquipment();

    return items.find((item) => item.id === id) || null;
}

export async function upsertEquipment(item: EquipmentItem): Promise<EquipmentItem> {
    const supabase = await getDB();

    const img1 = item.images?.[0] || ({src: '', variants: {}} as EquipmentImage);
    const img2 = item.images?.[1] || ({src: '', variants: {}} as EquipmentImage);
    const img3 = item.images?.[2] || ({src: '', variants: {}} as EquipmentImage);

    const row = {
        name: item.name,
        brand: item.brand || '',
        model_year: item.modelYear || '',
        description: item.description || '',
        price_per_day: Number(item.pricePerDay || 0),
        image_1: img1.src || '',
        image_1_webp: img1.variants?.webp || '',
        image_1_jpg: img1.variants?.jpg || '',
        image_2: img2.src || '',
        image_2_webp: img2.variants?.webp || '',
        image_2_jpg: img2.variants?.jpg || '',
        image_3: img3.src || '',
        image_3_webp: img3.variants?.webp || '',
        image_3_jpg: img3.variants?.jpg || '',
        video: item.video || '',
        updated_at: nowIso()
    };

    if (item.id) {
        const {data, error} = await supabase
            .from('equipment')
            .update(row)
            .eq('id', item.id)
            .select('*')
            .single();

        if (error) {
            throw formatSupabaseError(`Updating equipment "${item.id}" failed`, error);
        }

        return {
            id: Number(data.id),
            name: data.name || '',
            brand: data.brand || '',
            modelYear: data.model_year || '',
            description: data.description || '',
            pricePerDay: Number(data.price_per_day || 0),
            video: data.video || '',
            images: [
                {
                    src: data.image_1 || '',
                    variants: {
                        webp: data.image_1_webp || '',
                        jpg: data.image_1_jpg || ''
                    }
                },
                {
                    src: data.image_2 || '',
                    variants: {
                        webp: data.image_2_webp || '',
                        jpg: data.image_2_jpg || ''
                    }
                },
                {
                    src: data.image_3 || '',
                    variants: {
                        webp: data.image_3_webp || '',
                        jpg: data.image_3_jpg || ''
                    }
                }
            ].filter((image) => image.src)
        };
    }

    const {data, error} = await supabase
        .from('equipment')
        .insert(row)
        .select('*')
        .single();

    if (error) {
        throw formatSupabaseError(`Creating equipment "${item.name}" failed`, error);
    }

    return {
        id: Number(data.id),
        name: data.name || '',
        brand: data.brand || '',
        modelYear: data.model_year || '',
        description: data.description || '',
        pricePerDay: Number(data.price_per_day || 0),
        video: data.video || '',
        images: [
            {
                src: data.image_1 || '',
                variants: {
                    webp: data.image_1_webp || '',
                    jpg: data.image_1_jpg || ''
                }
            },
            {
                src: data.image_2 || '',
                variants: {
                    webp: data.image_2_webp || '',
                    jpg: data.image_2_jpg || ''
                }
            },
            {
                src: data.image_3 || '',
                variants: {
                    webp: data.image_3_webp || '',
                    jpg: data.image_3_jpg || ''
                }
            }
        ].filter((image) => image.src)
    };
}

export async function deleteEquipment(id: number): Promise<boolean> {
    if (!Number.isFinite(id)) return false;

    const supabase = await getDB();

    const {error, count} = await supabase
        .from('equipment')
        .delete({
            count: 'exact'
        })
        .eq('id', id);

    if (error) {
        throw formatSupabaseError(`Deleting equipment "${id}" failed`, error);
    }

    return (count ?? 0) > 0;
}