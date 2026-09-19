import {fail} from '@sveltejs/kit';
import type {Actions, ServerLoad} from '@sveltejs/kit';

import type {GalleryTag} from '$lib/cms/gallery/types';
import {allGalleryTags, upsertGallery} from '$lib/server/cms/galleryStore';
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

function safeId(value: string) {
    return value
        .trim()
        .replace(/\.json$/i, '')
        .replaceAll('/', '')
        .replaceAll('\\', '')
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function actionError(status: number, errorKey: string, message?: string) {
    return fail(status, {
        ok: false,
        errorKey,
        message
    });
}

export const load: ServerLoad = async () => {
    return {
        item: null,
        tags: await allGalleryTags()
    };
};

export const actions: Actions = {
    save: async ({request}) => {
        const form = await request.formData();
        const upload = form.get('media');

        if (!(upload instanceof File) || upload.size === 0) {
            return actionError(400, 'admin.gallery.errors.mediaRequired');
        }

        const id = safeId(String(form.get('id') || `g-${crypto.randomUUID()}`));

        if (!id) {
            return actionError(400, 'admin.gallery.errors.invalidId');
        }

        let saved;

        try {
            saved = await saveGalleryMedia(upload, id);
        } catch (error) {
            return actionError(
                400,
                'admin.gallery.errors.processingFailed',
                error instanceof Error ? error.message : undefined
            );
        }

        try {
            const requestedYear = parseYear(form.get('year'));

            await upsertGallery({
                id,
                type: saved.type,
                src480: saved.src480,
                src960: saved.src960,
                videoSrc: saved.videoSrc,
                alt: {
                    el: String(form.get('alt_el') || '').trim(),
                    de: String(form.get('alt_de') || '').trim()
                },
                tags: parseLocalizedTags(form),
                year: requestedYear ?? saved.year,
                width: saved.width,
                height: saved.height
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
            id
        };
    }
};
