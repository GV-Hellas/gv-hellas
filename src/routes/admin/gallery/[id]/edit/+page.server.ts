import {error, fail, redirect} from '@sveltejs/kit';
import type {Actions, ServerLoad} from '@sveltejs/kit';

import {allGalleryTags, getGalleryById, upsertGallery} from '$lib/server/cms/galleryStore';
import {saveGalleryMedia} from '$lib/server/cms/galleryMediaStore';

function parseTags(value: FormDataEntryValue | null) {
    return String(value || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
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
            throw error(404, 'Gallery item not found');
        }

        const upload = form.get('media');

        let type = existing.type;
        let src480 = existing.src480;
        let src960 = existing.src960;
        let videoSrc = existing.videoSrc;
        let width = existing.width;
        let height = existing.height;

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
        }

        await upsertGallery({
            id: existing.id,
            type,
            src480,
            src960,
            videoSrc,
            alt: String(form.get('alt') || ''),
            tags: parseTags(form.get('tags')),
            width,
            height
        });

        throw redirect(303, '/admin/gallery');
    }
};