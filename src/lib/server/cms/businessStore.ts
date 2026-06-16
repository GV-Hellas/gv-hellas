import type {BusinessPayload, BusinessSaveInput, StoredBusiness, SponsorType} from '$lib/cms/business/types';
import {businessPayloadSchema} from '$lib/cms/business/validation';
import {supabase} from '$lib/server/supabaseClient';
import {slugify} from '$lib/utils';

type BusinessRow = {
    id: number;
    sponsor_type: string | null;
    name: string | null;
    slug: string | null;
    logo: string | null;
    logo_webp?: string | null;
    logo_jpg?: string | null;
    description_el: string | null;
    description_de: string | null;
    url: string | null;
    email: string | null;
    telephone: string | null;
    contact_person: string | null;
    sections: unknown;
    created_at: string | null;
    updated_at: string | null;
};

const SPONSOR_TYPES = ['listed', 'bronze', 'silver', 'gold'] as const;

function safeSlug(value: string) {
    return value
        .trim()
        .replace(/\.json$/i, '')
        .replaceAll('/', '')
        .replaceAll('\\', '');
}

function normalizeSlug(value: string | undefined, fallbackName: string) {
    return safeSlug(value || '') || safeSlug(slugify(fallbackName));
}

function normalizeSponsorType(value: unknown): SponsorType {
    return typeof value === 'string' && (SPONSOR_TYPES as readonly string[]).includes(value)
        ? (value as SponsorType)
        : 'listed';
}

function normalizeSections(value: unknown): BusinessPayload['sections'] {
    if (Array.isArray(value)) {
        return value as BusinessPayload['sections'];
    }

    if (typeof value === 'string' && value.trim()) {
        try {
            const parsed = JSON.parse(value);

            if (Array.isArray(parsed)) {
                return parsed as BusinessPayload['sections'];
            }
        } catch {
            return [];
        }
    }

    return [];
}

function rowToStoredBusiness(row: BusinessRow): StoredBusiness {
    const now = new Date().toISOString();

    return {
        id: Number(row.id),
        sponsorType: normalizeSponsorType(row.sponsor_type),
        name: row.name || '',
        slug: row.slug || '',
        logo: row.logo || row.logo_webp || row.logo_jpg || '',
        description: {
            el: row.description_el || '',
            de: row.description_de || ''
        },
        url: row.url || '',
        email: row.email || '',
        telephone: row.telephone || '',
        contactPerson: row.contact_person || '',
        sections: normalizeSections(row.sections),
        createdAt: row.created_at || now,
        updatedAt: row.updated_at || now
    };
}

function normalizePayload(input: BusinessSaveInput): BusinessPayload {
    const result = businessPayloadSchema.safeParse(input);

    if (!result.success) {
        throw new Error(result.error.issues[0]?.message || 'Invalid business data');
    }

    return result.data as BusinessPayload;
}

function businessToRow(business: BusinessPayload) {
    return {
        sponsor_type: business.sponsorType || 'listed',
        name: business.name || '',
        slug: business.slug,
        logo: business.logo || '',
        logo_webp: '',
        logo_jpg: '',
        description_el: business.description.el || '',
        description_de: business.description.de || '',
        url: business.url || '',
        email: business.email || '',
        telephone: business.telephone || '',
        contact_person: business.contactPerson || '',
        sections: business.sections || [],
        updated_at: new Date().toISOString()
    };
}

function formatSupabaseError(context: string, error: {message: string}) {
    return new Error(`${context}: ${error.message}`);
}

export async function listBusinesses(): Promise<StoredBusiness[]> {
    const {data, error} = await supabase
        .from('businesses')
        .select('*')
        .order('sponsor_type', {ascending: true})
        .order('name', {ascending: true});

    if (error) {
        throw formatSupabaseError('Listing businesses failed', error);
    }

    return (data || [])
        .map((row) => rowToStoredBusiness(row as BusinessRow))
        .sort((a, b) => {
            const order: Record<SponsorType, number> = {
                gold: 1,
                silver: 2,
                bronze: 3,
                listed: 4
            };

            return order[a.sponsorType] - order[b.sponsorType] || a.name.localeCompare(b.name);
        });
}

export async function getBusinessById(id: number): Promise<StoredBusiness | null> {
    if (!Number.isFinite(id)) return null;

    const {data, error} = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .maybeSingle<BusinessRow>();

    if (error) {
        throw formatSupabaseError(`Loading business "${id}" failed`, error);
    }

    return data ? rowToStoredBusiness(data) : null;
}

export async function getBusinessBySlug(slug: string): Promise<StoredBusiness | null> {
    const cleanSlug = safeSlug(slug);

    if (!cleanSlug) return null;

    const {data, error} = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', cleanSlug)
        .maybeSingle<BusinessRow>();

    if (error) {
        throw formatSupabaseError(`Loading business "${cleanSlug}" failed`, error);
    }

    return data ? rowToStoredBusiness(data) : null;
}

export async function saveBusiness(input: BusinessSaveInput, currentSlug?: string): Promise<StoredBusiness> {
    const existing =
        input.id
            ? await getBusinessById(input.id)
            : currentSlug
                ? await getBusinessBySlug(currentSlug)
                : input.slug
                    ? await getBusinessBySlug(input.slug)
                    : null;

    const payload = normalizePayload({
        ...input,
        slug: normalizeSlug(input.slug, input.name)
    });

    const slug = existing?.slug || normalizeSlug(payload.slug, payload.name);

    if (!slug) {
        throw new Error('Invalid business slug');
    }

    const row = businessToRow({
        ...payload,
        slug
    });

    if (existing?.id) {
        const {data, error} = await supabase
            .from('businesses')
            .update(row)
            .eq('id', existing.id)
            .select('*')
            .single<BusinessRow>();

        if (error) {
            throw formatSupabaseError(`Updating business "${slug}" failed`, error);
        }

        return rowToStoredBusiness(data);
    }

    const {data, error} = await supabase
        .from('businesses')
        .insert(row)
        .select('*')
        .single<BusinessRow>();

    if (error) {
        throw formatSupabaseError(`Creating business "${slug}" failed`, error);
    }

    return rowToStoredBusiness(data);
}

export async function deleteBusiness(id: number): Promise<boolean> {
    if (!Number.isFinite(id)) return false;

    const {error, count} = await supabase
        .from('businesses')
        .delete({count: 'exact'})
        .eq('id', id);

    if (error) {
        throw formatSupabaseError(`Deleting business "${id}" failed`, error);
    }

    return (count ?? 0) > 0;
}