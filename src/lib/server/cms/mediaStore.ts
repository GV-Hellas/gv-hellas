import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';

const UPLOAD_ROOT = path.resolve('static/uploads/events');

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'audio/mpeg',
    'audio/wav'
]);

function safeSlug(slug: string) {
    return slug
        .trim()
        .replace(/\.json$/i, '')
        .replaceAll('/', '')
        .replaceAll('\\', '');
}

function safeExtension(file: File) {
    const fromName = file.name.split('.').pop()?.toLowerCase();

    if (fromName && /^[a-z0-9]+$/.test(fromName)) {
        return fromName;
    }

    if (file.type === 'image/jpeg') return 'jpg';
    if (file.type === 'image/png') return 'png';
    if (file.type === 'image/webp') return 'webp';
    if (file.type === 'image/gif') return 'gif';
    if (file.type === 'video/mp4') return 'mp4';
    if (file.type === 'audio/mpeg') return 'mp3';
    if (file.type === 'audio/wav') return 'wav';

    return 'bin';
}

function assertValidMediaFile(file: File) {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
        throw new Error(`Unsupported media type: ${file.type || 'unknown'}`);
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error('Uploaded media file is too large');
    }
}

export async function saveEventMedia(file: File, slug: string) {
    assertValidMediaFile(file);

    const cleanSlug = safeSlug(slug);

    if (!cleanSlug) {
        throw new Error('Invalid event slug for media upload');
    }

    const dir = path.join(UPLOAD_ROOT, cleanSlug);

    await mkdir(dir, {recursive: true});

    const ext = safeExtension(file);
    const storedFilename = `${crypto.randomUUID()}.${ext}`;
    const filepath = path.join(dir, storedFilename);

    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(filepath, buffer);

    return {
        url: `/uploads/events/${encodeURIComponent(cleanSlug)}/${storedFilename}`,
        filename: storedFilename,
        originalFilename: file.name,
        mimeType: file.type,
        size: file.size
    };
}