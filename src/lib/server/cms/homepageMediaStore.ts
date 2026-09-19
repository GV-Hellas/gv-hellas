import sharp from 'sharp';

import {uploadToR2} from '$lib/server/r2';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const HERO_RATIO_WIDTH = 16;
const HERO_RATIO_HEIGHT = 7;
const HERO_WIDTHS = [480, 960, 1920] as const;
const WEBP_QUALITY = 82;

function assertHeroImage(file: File) {
    if (!file.type.startsWith('image/')) {
        throw new Error(`Unsupported hero image type: ${file.type || 'unknown'}`);
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error('Homepage hero image is too large');
    }
}

async function fileToBuffer(file: File) {
    return Buffer.from(await file.arrayBuffer());
}

function fileFromBuffer(buffer: Buffer, name: string) {
    // @ts-ignore Node 24 provides File globally; this keeps TS compatible with Buffer.
    return new File([buffer], name, {type: 'image/webp'});
}

async function renderVariant(source: Buffer, width: number) {
    const height = Math.round((width * HERO_RATIO_HEIGHT) / HERO_RATIO_WIDTH);

    return sharp(source)
        .rotate()
        .resize({
            width,
            height,
            fit: 'cover',
            position: 'attention'
        })
        .webp({
            quality: WEBP_QUALITY,
            effort: 5
        })
        .toBuffer();
}

export async function saveHomepageHeroImage(file: File) {
    assertHeroImage(file);

    const source = await fileToBuffer(file);
    const batchId = crypto.randomUUID();
    const urls = new Map<number, string>();

    for (const width of HERO_WIDTHS) {
        const output = await renderVariant(source, width);
        const key = `homepage/hero/${batchId}-${width}.webp`;
        const uploaded = await uploadToR2({
            key,
            file: fileFromBuffer(output, `${batchId}-${width}.webp`),
            cacheControl: 'public, max-age=31536000, immutable'
        });

        urls.set(width, uploaded.url);
    }

    return {
        image480: urls.get(480) || '',
        image960: urls.get(960) || '',
        image1920: urls.get(1920) || '',
        imageFallback: urls.get(1920) || urls.get(960) || urls.get(480) || ''
    };
}
