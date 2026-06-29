import sharp from 'sharp';

import {uploadToR2} from '$lib/server/r2';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const LOGO_SIZE = 512;
const WEBP_QUALITY = 82;

function safeId(value: number | string) {
    return String(value)
        .trim()
        .replaceAll('/', '')
        .replaceAll('\\', '')
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function fileToBuffer(file: File) {
    return Buffer.from(await file.arrayBuffer());
}

function assertLogoFile(file: File) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error('Uploaded logo file is too large');
    }

    if (!file.type.startsWith('image/')) {
        throw new Error(`Unsupported logo file type: ${file.type || 'unknown'}`);
    }
}

function fileFromBuffer(buffer: Buffer, name: string, type: string) {
    return new File([buffer], name, {type});
}

export async function saveLinkLogo(file: File, linkId: number | string) {
    assertLogoFile(file);

    const cleanId = safeId(linkId);

    if (!cleanId) {
        throw new Error('Invalid link id for logo upload');
    }

    const source = await fileToBuffer(file);

    const webp = await sharp(source)
        .rotate()
        .resize({
            width: LOGO_SIZE,
            height: LOGO_SIZE,
            fit: 'inside',
            withoutEnlargement: true
        })
        .webp({
            quality: WEBP_QUALITY,
            effort: 5
        })
        .toBuffer();

    const uploadId = crypto.randomUUID();
    const key = `links/${cleanId}/${uploadId}.webp`;

    const uploaded = await uploadToR2({
        key,
        file: fileFromBuffer(webp, `${uploadId}.webp`, 'image/webp'),
        cacheControl: 'public, max-age=31536000, immutable'
    });

    return {
        url: uploaded.url,
        key,
        mimeType: 'image/webp',
        size: webp.length
    };
}