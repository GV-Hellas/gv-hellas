import {error, fail} from '@sveltejs/kit';
import type {Actions, ServerLoad} from '@sveltejs/kit';

import type {GalleryTag} from '$lib/cms/gallery/types';
import {allGalleryTags, getGalleryById, upsertGallery} from '$lib/server/cms/galleryStore';
import {saveGalleryMedia} from '$lib/server/cms/galleryMediaStore';

function parseTags(value: FormDataEntryValue | null) {
    return String(value || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
}

function parseLocalizedTags(form: FormData): GalleryTag[] {
    const greek = parseTags(form.get('tags_el'));
    const german = parseTags(form.get('tags_de'));
    const count = Math.max(greek.length, german.length);

    return Array.from({length: count}, (_, index) => {
        const el = greek[index] || german[index] || '';
        const de = german[index] || greek[index] || '';

        return {
            id: 0,
            name: {el, de}
        };
    }).filter((tag) => tag.name.el || tag.name.de);
}

function parseYear(value: FormDataEntryValue | null) {
    const raw = String(value || '').trim();
    if (!raw) return null;

    const year = Number(raw);
    return Number.isInteger(year) && year >= 1800 && year <= 2200 ? year : null;
}

function actionError(status: number, errorKey: string, message?: string) {
    return fail(status, {
        ok: false,
        errorKey,
        message
    });
}

export const load: ServerLoad = async ({params}) => {
    const item = await getGalleryById(params.id);

    if (!item) {
        throw error(404, 'Gallery item not found');
    }

    return {
        item,
        tags: await allGalleryTags()
    };
};

export const actions: Actions = {
    save: async ({request, params}) => {
        const form = await request.formData();
        const existing = await getGalleryById(params.id);

        if (!existing) {
            return actionError(404, 'admin.gallery.errors.notFound');
        }

        const upload = form.get('media');

        let type = existing.type;
        let src480 = existing.src480;
        let src960 = existing.src960;
        let videoSrc = existing.videoSrc;
        let width = existing.width;
        let height = existing.height;
        let detectedYear: number | null = null;

        if (upload instanceof File && upload.size > 0) {
            let saved;

            try {
                saved = await saveGalleryMedia(upload, existing.id);
            } catch (error) {
                return actionError(
                    400,
                    'admin.gallery.errors.processingFailed',
                    error instanceof Error ? error.message : undefined
                );
            }

            type = saved.type;
            src480 = saved.src480;
            src960 = saved.src960;
            videoSrc = saved.videoSrc;
            width = saved.width;
            height = saved.height;
            detectedYear = saved.year;
        }

        try {
            const rawYear = String(form.get('year') || '').trim();
            const requestedYear = parseYear(form.get('year'));

            await upsertGallery({
                id: existing.id,
                type,
                src480,
                src960,
                videoSrc,
                alt: {
                    el: String(form.get('alt_el') || '').trim(),
                    de: String(form.get('alt_de') || '').trim()
                },
                tags: parseLocalizedTags(form),
                year: requestedYear ?? (rawYear ? null : detectedYear),
                width,
                height
            });
        } catch (error) {
            return actionError(
                500,
                'admin.gallery.errors.saveFailed',
                error instanceof Error ? error.message : undefined
            );
        }

        return {
            ok: true,
            id: existing.id
        };
    }
};
