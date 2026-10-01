import type {EquipmentPayload, StoredEquipment} from '$lib/cms/equipment/types';
import {equipmentPayloadSchema} from '$lib/cms/equipment/schema';
import {getSql} from '$lib/server/neonClient';
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


async function slugExists(slug:string){return (await getSql()`SELECT id FROM equipment WHERE slug=${slug} LIMIT 1`).length>0}
async function uniqueSlug(base:string){const clean=safeSlug(base)||`equipment-${crypto.randomUUID()}`;let c=clean,n=2;while(await slugExists(c)){c=`${clean}-${n++}`}return c}
export async function listEquipment():Promise<StoredEquipment[]>{const rows=await getSql()`SELECT * FROM equipment ORDER BY created_at DESC`;return rows.map(r=>rowToStoredEquipment(r as EquipmentRow))}
export async function getEquipmentById(id:number):Promise<StoredEquipment|null>{if(!Number.isFinite(id))return null;const rows=await getSql()`SELECT * FROM equipment WHERE id=${id} LIMIT 1`;return rows[0]?rowToStoredEquipment(rows[0] as EquipmentRow):null}
export async function getEquipmentBySlug(slug:string):Promise<StoredEquipment|null>{const clean=safeSlug(slug);if(!clean)return null;const rows=await getSql()`SELECT * FROM equipment WHERE slug=${clean} LIMIT 1`;return rows[0]?rowToStoredEquipment(rows[0] as EquipmentRow):null}
export async function createEquipmentSlug(title:string){return uniqueSlug(slugify(title)||`equipment-${crypto.randomUUID()}`)}
async function writeEquipment(row:ReturnType<typeof equipmentToRow>, id?:number){const sections=JSON.stringify(row.sections||[]);if(id){return await getSql()`UPDATE equipment SET slug=${row.slug},title_el=${row.title_el},title_de=${row.title_de},description_el=${row.description_el},description_de=${row.description_de},price_per_day=${row.price_per_day},sections=${sections}::jsonb,name=${row.name},brand=${row.brand},model_year=${row.model_year},description=${row.description},image_1=${row.image_1},image_1_webp=${row.image_1_webp},image_1_jpg=${row.image_1_jpg},image_2=${row.image_2},image_2_webp=${row.image_2_webp},image_2_jpg=${row.image_2_jpg},image_3=${row.image_3},image_3_webp=${row.image_3_webp},image_3_jpg=${row.image_3_jpg},video=${row.video},updated_at=NOW() WHERE id=${id} RETURNING *`}return await getSql()`INSERT INTO equipment(slug,title_el,title_de,description_el,description_de,price_per_day,sections,name,brand,model_year,description,image_1,image_1_webp,image_1_jpg,image_2,image_2_webp,image_2_jpg,image_3,image_3_webp,image_3_jpg,video,updated_at) VALUES(${row.slug},${row.title_el},${row.title_de},${row.description_el},${row.description_de},${row.price_per_day},${sections}::jsonb,${row.name},${row.brand},${row.model_year},${row.description},${row.image_1},${row.image_1_webp},${row.image_1_jpg},${row.image_2},${row.image_2_webp},${row.image_2_jpg},${row.image_3},${row.image_3_webp},${row.image_3_jpg},${row.video},NOW()) RETURNING *`}
export async function createEquipment(input:EquipmentPayload,requestedSlug?:string){const e=normalizePayload(input);const slug=requestedSlug?safeSlug(requestedSlug):await createEquipmentSlug(e.title.el||e.title.de);if(!slug)throw new Error('Invalid equipment slug');const rows=await writeEquipment(equipmentToRow(e,slug));return rowToStoredEquipment(rows[0] as EquipmentRow)}
export async function updateEquipment(id:number,input:EquipmentPayload){const existing=await getEquipmentById(id);if(!existing)throw new Error('Equipment not found');const rows=await writeEquipment(equipmentToRow(normalizePayload(input),existing.slug),existing.id);return rowToStoredEquipment(rows[0] as EquipmentRow)}
export async function deleteEquipment(id:number){if(!Number.isFinite(id))return false;return (await getSql()`DELETE FROM equipment WHERE id=${id} RETURNING id`).length>0}
