import {fail, redirect} from '@sveltejs/kit';
import type {Actions, ServerLoad} from '@sveltejs/kit';

import {allGalleryTags, upsertGallery} from '$lib/server/cms/galleryStore';
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

export const load: ServerLoad = async () => {
    return {
        item: null,
        tags: await allGalleryTags()
    };
};

export const actions: Actions = {
    save: async ({request}) => {
        const form = await request.formData();
        const upload = form.get('image');

        if (!(upload instanceof File) || upload.size === 0) {
            return actionError(400, 'Image or video required');
        }

        const id = String(form.get('id') || `g-${crypto.randomUUID()}`)
            .trim()
            .replaceAll('/', '')
            .replaceAll('\\', '');

        if (!id) {
            return actionError(400, 'Invalid gallery item id');
        }

        let processed;

        try {
            processed = await prepareUploadedMediaFile(upload);
        } catch (error) {
            return actionError(
                400,
                error instanceof Error ? error.message : 'Could not process gallery media'
            );
        }

        const saved = await saveGalleryMedia(processed.file, id);

        await upsertGallery({
            id,
            type: processed.kind,
            src: saved.url,
            srcVariants: {
                webp: processed.kind === 'image' ? saved.url : '',
                jpg: ''
            },
            alt: String(form.get('alt') || ''),
            tags: parseTags(form.get('tags'))
        });

        throw redirect(303, '/admin/gallery');
    }
};