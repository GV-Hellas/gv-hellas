import type {EquipmentPayload, StoredEquipment} from '$lib/cms/equipment/types';
import {equipmentPayloadSchema} from '$lib/cms/equipment/schema';
import {supabase} from '$lib/server/supabaseClient';
import {slugify} from '$lib/utils';

type EquipmentRow = {
    id: number;
    slug: string | null;
    title_el: string | null;
    title_de: string | null;
    description_el: string | null;
    description_de: string | null;
    price_per_day: number | null;
    sections: unknown;
    created_at: string | null;
    updated_at: string | null;
    // Legacy columns retained during migration for backwards compatibility.
    name?: string | null;
    description?: string | null;
};

function safeSlug(value: string) {
    return value
        .trim()
        .replace(/\.json$/i, '')
        .replaceAll('/', '')
        .replaceAll('\\', '');
}

function normalizeSections(value: unknown): EquipmentPayload['sections'] {
    if (Array.isArray(value)) {
        return value as EquipmentPayload['sections'];
    }

    if (typeof value === 'string' && value.trim()) {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parsed as EquipmentPayload['sections'];
        } catch {
            return [];
        }
    }

    return [];
}

function rowToStoredEquipment(row: EquipmentRow): StoredEquipment {
    const now = new Date().toISOString();
    const legacyTitle = row.name || '';
    const legacyDescription = row.description || '';

    return {
        id: Number(row.id),
        slug: row.slug || `equipment-${row.id}`,
        title: {
            el: row.title_el || legacyTitle,
            de: row.title_de || row.title_el || legacyTitle
        },
        description: {
            el: row.description_el || legacyDescription,
            de: row.description_de || row.description_el || legacyDescription
        },
        pricePerDay: Number(row.price_per_day || 0),
        sections: normalizeSections(row.sections),
        createdAt: row.created_at || now,
        updatedAt: row.updated_at || now
    };
}

function normalizePayload(input: EquipmentPayload): EquipmentPayload {
    const result = equipmentPayloadSchema.safeParse(input);

    if (!result.success) {
        throw new Error(result.error.issues[0]?.message || 'Invalid equipment data');
    }

    return result.data as EquipmentPayload;
}

function equipmentToRow(equipment: EquipmentPayload, slug: string) {
    return {
        slug,
        title_el: equipment.title.el || '',
        title_de: equipment.title.de || equipment.title.el || '',
        description_el: equipment.description.el || '',
        description_de: equipment.description.de || '',
        price_per_day: Number(equipment.pricePerDay || 0),
        sections: equipment.sections || [],

        // Keep the original equipment schema populated while the old columns exist.
        name: equipment.title.el || equipment.title.de || '',
        brand: '',
        model_year: '',
        description: equipment.description.el || '',
        image_1: '',
        image_1_webp: '',
        image_1_jpg: '',
        image_2: '',
        image_2_webp: '',
        image_2_jpg: '',
        image_3: '',
        image_3_webp: '',
        image_3_jpg: '',
        video: '',
        updated_at: new Date().toISOString()
    };
}

function formatSupabaseError(context: string, error: {message: string}) {
    return new Error(`${context}: ${error.message}`);
}

async function slugExists(slug: string) {
    const {data, error} = await supabase
        .from('equipment')
        .select('id')
        .eq('slug', slug)
        .limit(1);

    if (error) {
        throw formatSupabaseError(`Checking equipment slug "${slug}" failed`, error);
    }

    return (data || []).length > 0;
}

async function uniqueSlug(base: string) {
    const cleanBase = safeSlug(base) || `equipment-${crypto.randomUUID()}`;
    let candidate = cleanBase;
    let counter = 2;

    while (await slugExists(candidate)) {
        candidate = `${cleanBase}-${counter}`;
        counter += 1;
    }

    return candidate;
}

export async function listEquipment(): Promise<StoredEquipment[]> {
    const {data, error} = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', {ascending: false});

    if (error) {
        throw formatSupabaseError('Listing equipment failed', error);
    }

    return (data || []).map((row) => rowToStoredEquipment(row as EquipmentRow));
}

export async function getEquipmentById(id: number): Promise<StoredEquipment | null> {
    if (!Number.isFinite(id)) return null;

    const {data, error} = await supabase
        .from('equipment')
        .select('*')
        .eq('id', id)
        .maybeSingle<EquipmentRow>();

    if (error) {
        throw formatSupabaseError(`Loading equipment "${id}" failed`, error);
    }

    return data ? rowToStoredEquipment(data) : null;
}

export async function getEquipmentBySlug(slug: string): Promise<StoredEquipment | null> {
    const cleanSlug = safeSlug(slug);

    if (!cleanSlug) return null;

    const {data, error} = await supabase
        .from('equipment')
        .select('*')
        .eq('slug', cleanSlug)
        .maybeSingle<EquipmentRow>();

    if (error) {
        throw formatSupabaseError(`Loading equipment "${cleanSlug}" failed`, error);
    }

    return data ? rowToStoredEquipment(data) : null;
}

export async function createEquipmentSlug(title: string): Promise<string> {
    const baseSlug = slugify(title) || `equipment-${crypto.randomUUID()}`;
    return uniqueSlug(baseSlug);
}

export async function createEquipment(input: EquipmentPayload, requestedSlug?: string): Promise<StoredEquipment> {
    const equipment = normalizePayload(input);
    const slug = requestedSlug
        ? safeSlug(requestedSlug)
        : await createEquipmentSlug(equipment.title.el || equipment.title.de);

    if (!slug) {
        throw new Error('Invalid equipment slug');
    }
    const row = equipmentToRow(equipment, slug);

    const {data, error} = await supabase
        .from('equipment')
        .insert(row)
        .select('*')
        .single<EquipmentRow>();

    if (error) {
        throw formatSupabaseError(`Creating equipment "${slug}" failed`, error);
    }

    return rowToStoredEquipment(data);
}

export async function updateEquipment(id: number, input: EquipmentPayload): Promise<StoredEquipment> {
    const existing = await getEquipmentById(id);

    if (!existing) {
        throw new Error('Equipment not found');
    }

    const equipment = normalizePayload(input);
    const row = equipmentToRow(equipment, existing.slug);

    const {data, error} = await supabase
        .from('equipment')
        .update(row)
        .eq('id', existing.id)
        .select('*')
        .single<EquipmentRow>();

    if (error) {
        throw formatSupabaseError(`Updating equipment "${existing.slug}" failed`, error);
    }

    return rowToStoredEquipment(data);
}

export async function deleteEquipment(id: number): Promise<boolean> {
    if (!Number.isFinite(id)) return false;

    const {error, count} = await supabase
        .from('equipment')
        .delete({count: 'exact'})
        .eq('id', id);

    if (error) {
        throw formatSupabaseError(`Deleting equipment "${id}" failed`, error);
    }

    return (count ?? 0) > 0;
}
