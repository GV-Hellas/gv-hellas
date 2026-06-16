import {uploadToR2} from '$lib/server/r2';

const MAX_FILE_SIZE_BYTES = 80 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
    'image/webp',
    'video/webm'
]);

function safeSlug(slug: string) {
    return slug
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

function assertValidFile(file: File) {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
        throw new Error(
            `Unsupported business media type: ${file.type || 'unknown'}. ` +
            `Media must be processed to WebP or WebM before upload.`
        );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error('Uploaded business media file is too large');
    }
}

export async function saveBusinessMedia(file: File, slug: string) {
    assertValidFile(file);

    const cleanSlug = safeSlug(slug);

    if (!cleanSlug) {
        throw new Error('Invalid business slug for media upload');
    }

    const ext = safeExtension(file);
    const storedFilename = `${crypto.randomUUID()}.${ext}`;
    const key = `businesses/${cleanSlug}/${storedFilename}`;

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