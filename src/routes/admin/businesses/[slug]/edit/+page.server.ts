import {error, fail} from '@sveltejs/kit';
import type {Actions} from '@sveltejs/kit';

import type {BusinessPayload, BusinessSection, SponsorType} from '$lib/cms/business/types';
import {businessPayloadSchema} from '$lib/cms/business/validation';
import {BUSINESS_SPONSOR_TYPES} from '$lib/cms/business/schema';
import {getBusinessBySlug, saveBusiness} from '$lib/server/cms/businessStore';
import {saveBusinessMedia} from '$lib/server/cms/businessMediaStore';
import {sanitizeEventHtml} from '$lib/server/html/sanitizeEventHtml';
import {
    prepareUploadedImageFile,
    prepareUploadedMediaFile,
    translateBusinessPayloadMissingGerman
} from '$lib/server/mediaProcessing';

type ActionResponse = {
    ok: boolean;
    id?: number;
    slug?: string;
    message?: string;
};

function localizedText(value: unknown) {
    if (!value || typeof value !== 'object') return {el: '', de: ''};

    const record = value as Partial<Record<'el' | 'de', unknown>>;

    return {
        el: typeof record.el === 'string' ? record.el : '',
        de: typeof record.de === 'string' ? record.de : ''
    };
}

function emptySection(): BusinessSection {
    return {
        id: crypto.randomUUID(),
        beforeHtml: {el: '', de: ''},
        media: [],
        afterHtml: {el: '', de: ''}
    };
}

function isSponsorType(value: unknown): value is SponsorType {
    return typeof value === 'string' && (BUSINESS_SPONSOR_TYPES as readonly string[]).includes(value);
}

function normalizeSponsorType(value: unknown): SponsorType {
    return isSponsorType(value) ? value : 'listed';
}

function normalizeBusinessForForm(raw: unknown): BusinessPayload {
    const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

    const sections =
        Array.isArray(source.sections) && source.sections.length > 0
            ? source.sections
            : [emptySection()];

    return {
        sponsorType: normalizeSponsorType(source.sponsorType),
        name: typeof source.name === 'string' ? source.name : '',
        slug: typeof source.slug === 'string' ? source.slug : '',
        logo: typeof source.logo === 'string' ? source.logo : '',
        description: localizedText(source.description),
        url: typeof source.url === 'string' ? source.url : '',
        email: typeof source.email === 'string' ? source.email : '',
        telephone: typeof source.telephone === 'string' ? source.telephone : '',
        contactPerson: typeof source.contactPerson === 'string' ? source.contactPerson : '',
        sections: sections as BusinessSection[]
    };
}

function normalizeIncomingPayload(parsedJson: unknown, existingSlug: string) {
    const source = parsedJson && typeof parsedJson === 'object' ? (parsedJson as Record<string, unknown>) : {};

    return {
        ...source,
        slug: existingSlug,
        sponsorType: normalizeSponsorType(source.sponsorType)
    };
}

function sanitizeBusiness(business: BusinessPayload) {
    business.description.el = sanitizeEventHtml(business.description.el);
    business.description.de = sanitizeEventHtml(business.description.de);

    for (const section of business.sections) {
        section.beforeHtml.el = sanitizeEventHtml(section.beforeHtml.el);
        section.beforeHtml.de = sanitizeEventHtml(section.beforeHtml.de);
        section.afterHtml.el = sanitizeEventHtml(section.afterHtml.el);
        section.afterHtml.de = sanitizeEventHtml(section.afterHtml.de);
    }

    return business;
}

async function attachProcessedBusinessMedia(business: BusinessPayload, formData: FormData, slug: string) {
    const logo = formData.get('logo');

    if (logo instanceof File && logo.size > 0) {
        const processedLogo = await prepareUploadedImageFile(logo);
        const savedLogo = await saveBusinessMedia(processedLogo.file, slug);

        business.logo = savedLogo.url;
    }

    for (const section of business.sections) {
        for (const media of section.media) {
            if (!media.uploadKey) continue;

            const file = formData.get(media.uploadKey);

            if (file instanceof File && file.size > 0) {
                const processed = await prepareUploadedMediaFile(file);
                const saved = await saveBusinessMedia(processed.file, slug);

                media.type = processed.kind;
                media.url = saved.url;
                media.filename = saved.filename;
                media.originalFilename = file.name;
                media.mimeType = saved.mimeType;
                media.size = saved.size;
            }

            delete media.uploadKey;
        }
    }
}

async function getBusinessFromRouteSlug(routeSlug: string) {
    return (
        (await getBusinessBySlug(routeSlug)) ??
        (await getBusinessBySlug(decodeURIComponent(routeSlug))) ??
        (await getBusinessBySlug(encodeURIComponent(routeSlug)))
    );
}

function actionError(status: number, message: string) {
    return fail(status, {
        ok: false,
        message
    } satisfies ActionResponse);
}

export const load = async ({params}: { params: { slug: string } }) => {
    const existing = await getBusinessFromRouteSlug(params.slug);

    if (!existing) {
        throw error(404, 'Business not found');
    }

    return {
        business: normalizeBusinessForForm(existing)
    };
};

export const actions: Actions = {
    save: async ({request, params}) => {
        const existing = await getBusinessFromRouteSlug(params.slug);

        if (!existing) {
            return actionError(404, 'Business not found');
        }

        const formData = await request.formData();
        const rawPayload = formData.get('payload');

        if (typeof rawPayload !== 'string') {
            return actionError(400, 'Missing business payload');
        }

        let parsedJson: unknown;

        try {
            parsedJson = JSON.parse(rawPayload);
        } catch {
            return actionError(400, 'Invalid business payload');
        }

        const normalized = normalizeIncomingPayload(parsedJson, existing.slug);
        const result = businessPayloadSchema.safeParse(normalized);

        if (!result.success) {
            return actionError(400, result.error.issues[0]?.message || 'Invalid business data');
        }

        const business: BusinessPayload = sanitizeBusiness(result.data);
        business.slug = existing.slug;

        await translateBusinessPayloadMissingGerman(business);
        sanitizeBusiness(business);

        try {
            await attachProcessedBusinessMedia(business, formData, existing.slug);
        } catch (error) {
            return actionError(
                400,
                error instanceof Error ? error.message : 'Could not process uploaded business media'
            );
        }

        const stored = await saveBusiness(business, existing.slug);

        return {
            ok: true,
            id: stored.id,
            slug: stored.slug,
            message: 'Business saved successfully'
        } satisfies ActionResponse;
    }
};