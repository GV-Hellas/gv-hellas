import {error, fail} from '@sveltejs/kit';
import type {Actions, ServerLoad} from '@sveltejs/kit';

import type {EquipmentPayload} from '$lib/cms/equipment/types';
import {equipmentPayloadSchema} from '$lib/cms/equipment/schema';
import {sanitizeEventHtml} from '$lib/server/html/sanitizeEventHtml';
import {
    getEquipmentById,
    updateEquipment
} from '$lib/server/cms/equipmentStore';
import {saveEquipmentMedia} from '$lib/server/cms/equipmentMediaStore';
import {
    prepareUploadedMediaFile,
    translateEquipmentPayloadMissingGerman
} from '$lib/server/mediaProcessing';

type ActionResponse = {
    ok: boolean;
    id?: number;
    slug?: string;
    errorKey?: string;
    message?: string;
};

function actionError(status: number, errorKey: string, message?: string) {
    return fail(status, {
        ok: false,
        errorKey,
        message
    } satisfies ActionResponse);
}

function sanitizeEquipment(equipment: EquipmentPayload) {
    for (const section of equipment.sections) {
        section.beforeHtml.el = sanitizeEventHtml(section.beforeHtml.el);
        section.beforeHtml.de = sanitizeEventHtml(section.beforeHtml.de);
        section.afterHtml.el = sanitizeEventHtml(section.afterHtml.el);
        section.afterHtml.de = sanitizeEventHtml(section.afterHtml.de);
    }

    return equipment;
}

async function attachProcessedMedia(
    equipment: EquipmentPayload,
    formData: FormData,
    slug: string
) {
    for (const section of equipment.sections) {
        for (const media of section.media) {
            if (!media.uploadKey) continue;

            const file = formData.get(media.uploadKey);

            if (file instanceof File && file.size > 0) {
                const processed = await prepareUploadedMediaFile(file);
                const saved = await saveEquipmentMedia(processed.file, slug);

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

export const load: ServerLoad = async ({params}) => {
    const id = Number(params.id);
    const item = await getEquipmentById(id);

    if (!item) {
        throw error(404, 'Equipment not found');
    }

    return {
        item: {
            title: item.title,
            description: item.description,
            pricePerDay: item.pricePerDay,
            sections: item.sections.length
                ? item.sections
                : [{
                    id: crypto.randomUUID(),
                    beforeHtml: {el: '', de: ''},
                    media: [],
                    afterHtml: {el: '', de: ''}
                }]
        } satisfies EquipmentPayload
    };
};

export const actions: Actions = {
    save: async ({request, params}) => {
        const id = Number(params.id);
        const existing = await getEquipmentById(id);

        if (!existing) {
            return actionError(404, 'admin.equipment.errors.notFound');
        }

        const formData = await request.formData();
        const rawPayload = formData.get('payload');

        if (typeof rawPayload !== 'string') {
            return actionError(400, 'admin.equipment.errors.invalidData');
        }

        let parsedJson: unknown;

        try {
            parsedJson = JSON.parse(rawPayload);
        } catch {
            return actionError(400, 'admin.equipment.errors.invalidData');
        }

        const source = parsedJson && typeof parsedJson === 'object'
            ? (parsedJson as Record<string, unknown>)
            : {};

        const normalized = {
            ...source,
            pricePerDay: Number(source.pricePerDay)
        };

        const result = equipmentPayloadSchema.safeParse(normalized);

        if (!result.success) {
            return actionError(
                400,
                'admin.equipment.errors.invalidData',
                result.error.issues[0]?.message
            );
        }

        const equipment = sanitizeEquipment(result.data as EquipmentPayload);
        await translateEquipmentPayloadMissingGerman(equipment);
        sanitizeEquipment(equipment);

        try {
            await attachProcessedMedia(equipment, formData, existing.slug);
        } catch (error) {
            return actionError(
                400,
                'admin.equipment.errors.mediaFailed',
                error instanceof Error ? error.message : undefined
            );
        }

        try {
            const stored = await updateEquipment(existing.id, equipment);

            return {
                ok: true,
                id: stored.id,
                slug: stored.slug
            } satisfies ActionResponse;
        } catch (error) {
            return actionError(
                500,
                'admin.equipment.errors.saveFailed',
                error instanceof Error ? error.message : undefined
            );
        }
    }
};
