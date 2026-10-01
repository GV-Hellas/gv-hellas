import type {BusinessPayload, BusinessSaveInput, StoredBusiness, SponsorType} from '$lib/cms/business/types';
import {businessPayloadSchema} from '$lib/cms/business/validation';
import {getSql} from '$lib/server/neonClient';
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
    if (value === 'main' || value === 'gold') return 'main';
    if (value === 'sponsor' || value === 'silver' || value === 'bronze' || value === 'listed') {
        return 'sponsor';
    }

    return 'sponsor';
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
        sponsor_type: business.sponsorType || 'sponsor',
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


async function assertMainSponsorAvailable(exceptId?: number) {
    const rows = exceptId
        ? await getSql()`SELECT id FROM businesses WHERE sponsor_type IN ('main','gold') AND id <> ${exceptId} LIMIT 1`
        : await getSql()`SELECT id FROM businesses WHERE sponsor_type IN ('main','gold') LIMIT 1`;
    if (rows.length) throw new Error('Only one main sponsor is allowed. Change the current main sponsor first.');
}

export async function listBusinesses(): Promise<StoredBusiness[]> {
    const rows = await getSql()`SELECT * FROM businesses ORDER BY sponsor_type ASC, name ASC`;
    return rows.map(r => rowToStoredBusiness(r as BusinessRow)).sort((a,b) => {
        const order: Record<SponsorType, number> = {main:1,sponsor:2};
        return order[a.sponsorType]-order[b.sponsorType] || a.name.localeCompare(b.name);
    });
}
export async function getBusinessById(id:number):Promise<StoredBusiness|null>{if(!Number.isFinite(id))return null;const rows=await getSql()`SELECT * FROM businesses WHERE id=${id} LIMIT 1`;return rows[0]?rowToStoredBusiness(rows[0] as BusinessRow):null}
export async function getBusinessBySlug(slug:string):Promise<StoredBusiness|null>{const clean=safeSlug(slug);if(!clean)return null;const rows=await getSql()`SELECT * FROM businesses WHERE slug=${clean} LIMIT 1`;return rows[0]?rowToStoredBusiness(rows[0] as BusinessRow):null}
export async function saveBusiness(input:BusinessSaveInput,currentSlug?:string):Promise<StoredBusiness>{
    const existing=input.id?await getBusinessById(input.id):currentSlug?await getBusinessBySlug(currentSlug):input.slug?await getBusinessBySlug(input.slug):null;
    const payload=normalizePayload({...input,slug:normalizeSlug(input.slug,input.name)});const slug=existing?.slug||normalizeSlug(payload.slug,payload.name);if(!slug)throw new Error('Invalid business slug');if(payload.sponsorType==='main')await assertMainSponsorAvailable(existing?.id);
    const r=businessToRow({...payload,slug});const sections=JSON.stringify(r.sections||[]);let rows;
    if(existing?.id){rows=await getSql()`UPDATE businesses SET sponsor_type=${r.sponsor_type},name=${r.name},slug=${r.slug},logo=${r.logo},logo_webp=${r.logo_webp},logo_jpg=${r.logo_jpg},description_el=${r.description_el},description_de=${r.description_de},url=${r.url},email=${r.email},telephone=${r.telephone},contact_person=${r.contact_person},sections=${sections}::jsonb,updated_at=NOW() WHERE id=${existing.id} RETURNING *`}
    else{rows=await getSql()`INSERT INTO businesses(sponsor_type,name,slug,logo,logo_webp,logo_jpg,description_el,description_de,url,email,telephone,contact_person,sections,updated_at) VALUES(${r.sponsor_type},${r.name},${r.slug},${r.logo},${r.logo_webp},${r.logo_jpg},${r.description_el},${r.description_de},${r.url},${r.email},${r.telephone},${r.contact_person},${sections}::jsonb,NOW()) RETURNING *`}
    return rowToStoredBusiness(rows[0] as BusinessRow);
}
export async function deleteBusiness(id:number):Promise<boolean>{if(!Number.isFinite(id))return false;return (await getSql()`DELETE FROM businesses WHERE id=${id} RETURNING id`).length>0}
