import {uploadToR2} from '$lib/server/r2';

const MAX_FILE_SIZE_BYTES = 80 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set(['image/webp', 'video/webm']);

function safeId(value: string) {
    return value
        .trim()
        .replace(/\.json$/i, '')
        .replaceAll('/', '')
        .replaceAll('\\', '');
}

function safeExtension(file: File) {
    if (file.type === 'image/webp') return 'webp';
    if (file.type === 'video/webm') return 'webm';

    return 'bin';
}

function assertValidGalleryFile(file: File) {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
        throw new Error(
            `Unsupported gallery media type: ${file.type || 'unknown'}. ` +
            `Gallery files must be processed to WebP or WebM before upload.`
        );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error('Uploaded gallery media file is too large');
    }
}

export async function saveGalleryMedia(file: File, itemId: string) {
    assertValidGalleryFile(file);

    const cleanId = safeId(itemId);

    if (!cleanId) {
        throw new Error('Invalid gallery item id for media upload');
    }

    const ext = safeExtension(file);
    const storedFilename = `${crypto.randomUUID()}.${ext}`;
    const key = `gallery/${cleanId}/${storedFilename}`;

    const uploaded = await uploadToR2({
        key,
        file,
        cacheControl: 'public, max-age=31536000, immutable'
    });

    return {
        url: uploaded.url,
        filename: storedFilename,
        originalFilename: file.name,
        mimeType: file.type,
        size: file.size
    };
}