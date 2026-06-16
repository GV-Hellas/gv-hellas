import {error, fail, redirect} from '@sveltejs/kit';
import type {Actions, ServerLoad} from '@sveltejs/kit';

import {allGalleryTags, getGalleryById, upsertGallery} from '$lib/server/cms/galleryStore';
import {saveGalleryMedia} from '$lib/server/cms/galleryMediaStore';
import {prepareUploadedMediaFile} from '$lib/server/mediaProcessing';

function parseTags(value: FormDataEntryValue | null) {
    return String(value || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
}

function actionError(status: number, message: string) {
    return fail(status, {
        ok: false,
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

        const upload = form.get('image');

        let src = existing.src;
        let srcVariants = existing.srcVariants;
        let type = existing.type;

        if (upload instanceof File && upload.size > 0) {
            let processed;

            try {
                processed = await prepareUploadedMediaFile(upload);
            } catch (error) {
                return actionError(
                    400,
                    error instanceof Error ? error.message : 'Could not process gallery media'
                );
            }

            const saved = await saveGalleryMedia(processed.file, existing.id);

            src = saved.url;
            type = processed.kind;
            srcVariants = {
                webp: processed.kind === 'image' ? saved.url : '',
                jpg: ''
            };
        }

        await upsertGallery({
            id: existing.id,
            type,
            src,
            srcVariants,
            alt: String(form.get('alt') || ''),
            tags: parseTags(form.get('tags'))
        });

        throw redirect(303, '/admin/gallery');
    }
};