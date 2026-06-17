import sharp from 'sharp';

import {uploadToR2} from '$lib/server/r2';
import {prepareUploadedMediaFile} from '$lib/server/mediaProcessing';

const MAX_FILE_SIZE_BYTES = 250 * 1024 * 1024;

const IMAGE_QUALITY = 78;

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

function assertValidInputFile(file: File) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error('Uploaded gallery file is too large');
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        throw new Error(`Unsupported gallery media type: ${file.type || 'unknown'}`);
    }
}

async function fileToBuffer(file: File) {
    return Buffer.from(await file.arrayBuffer());
}

async function imageVariant(input: Buffer, width: number) {
    const output = await sharp(input)
        .rotate()
        .resize({
            width,
            fit: 'inside',
            withoutEnlargement: true
        })
        .webp({
            quality: IMAGE_QUALITY,
            effort: 5
        })
        .toBuffer();

    const metadata = await sharp(output).metadata();

    return {
        output,
        width: metadata.width ?? null,
        height: metadata.height ?? null
    };
}

function fileFromBuffer(buffer: Buffer, name: string, type: string) {
    // @ts-ignore
    return new File([buffer], name, {type});
}

export type SavedGalleryMedia =
    | {
    type: 'image';
    src480: string;
    src960: string;
    videoSrc: '';
    width: number | null;
    height: number | null;
}
    | {
    type: 'video';
    src480: '';
    src960: '';
    videoSrc: string;
    width: null;
    height: null;
};

export async function saveGalleryMedia(file: File, itemId: string): Promise<SavedGalleryMedia> {
    assertValidInputFile(file);

    const cleanId = safeId(itemId);

    if (!cleanId) {
        throw new Error('Invalid gallery item id for media upload');
    }

    const batchId = crypto.randomUUID();

    if (file.type.startsWith('image/')) {
        const source = await fileToBuffer(file);
        const variant480 = await imageVariant(source, 480);
        const variant960 = await imageVariant(source, 960);

        const file480 = fileFromBuffer(variant480.output, `${batchId}-480.webp`, 'image/webp');
        const file960 = fileFromBuffer(variant960.output, `${batchId}-960.webp`, 'image/webp');

        const uploaded480 = await uploadToR2({
            key: `gallery/${cleanId}/${batchId}-480.webp`,
            file: file480,
            cacheControl: 'public, max-age=31536000, immutable'
        });

        const uploaded960 = await uploadToR2({
            key: `gallery/${cleanId}/${batchId}-960.webp`,
            file: file960,
            cacheControl: 'public, max-age=31536000, immutable'
        });

        return {
            type: 'image',
            src480: uploaded480.url,
            src960: uploaded960.url,
            videoSrc: '',
            width: variant960.width,
            height: variant960.height
        };
    }

    const processed = await prepareUploadedMediaFile(file);

    if (processed.kind !== 'video') {
        throw new Error('Gallery video processing failed');
    }

    const uploaded = await uploadToR2({
        key: `gallery/${cleanId}/${batchId}.webm`,
        file: processed.file,
        cacheControl: 'public, max-age=31536000, immutable'
    });

    return {
        type: 'video',
        src480: '',
        src960: '',
        videoSrc: uploaded.url,
        width: null,
        height: null
    };
}