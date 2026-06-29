import {fail, redirect} from '@sveltejs/kit';
import type {Actions, ServerLoad} from '@sveltejs/kit';

import {allGalleryTags, upsertGallery} from '$lib/server/cms/galleryStore';
import {saveGalleryMedia} from '$lib/server/cms/galleryMediaStore';

function parseTags(value: FormDataEntryValue | null) {
    return String(value || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
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

        await upsertGallery({
            id,
            type: saved.type,
            src480: saved.src480,
            src960: saved.src960,
            videoSrc: saved.videoSrc,
            alt: String(form.get('alt') || ''),
            tags: parseTags(form.get('tags')),
            width: saved.width,
            height: saved.height
        });

        throw redirect(303, '/admin/gallery');
    }
};