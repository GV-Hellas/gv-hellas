import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import sharp from 'sharp';
import {createClient} from '@supabase/supabase-js';
import {PutObjectCommand, S3Client} from '@aws-sdk/client-s3';

dotenv.config({path: '.env'});
dotenv.config({path: '.env.local', override: true});

const execFileAsync = promisify(execFile);

const ROOT = process.cwd();
const DRY_RUN = process.env.DRY_RUN === 'true';

const SQLITE_DB_PATH = path.resolve(ROOT, process.env.SQLITE_DB_PATH || 'data/cms.db');

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET;
const R2_PUBLIC_BASE_URL = process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL;

const MAX_IMAGE_WIDTH = 1280;
const MAX_IMAGE_HEIGHT = 720;
const IMAGE_WEBP_QUALITY = 78;

const MAX_VIDEO_WIDTH = 1280;
const MAX_VIDEO_HEIGHT = 720;
const VIDEO_CRF = process.env.CMS_VIDEO_CRF || '34';
const VIDEO_CPU_USED = process.env.CMS_VIDEO_CPU_USED || '5';

function required(value, name) {
    if (!value) throw new Error(`${name} is not set`);
    return value;
}

required(SUPABASE_URL, 'PUBLIC_SUPABASE_URL');
required(SUPABASE_SECRET_KEY, 'SUPABASE_SECRET_KEY');
required(R2_ACCOUNT_ID, 'CLOUDFLARE_R2_ACCOUNT_ID');
required(R2_ACCESS_KEY_ID, 'CLOUDFLARE_R2_ACCESS_KEY_ID');
required(R2_SECRET_ACCESS_KEY, 'CLOUDFLARE_R2_SECRET_ACCESS_KEY');
required(R2_BUCKET, 'CLOUDFLARE_R2_BUCKET');
required(R2_PUBLIC_BASE_URL, 'CLOUDFLARE_R2_PUBLIC_BASE_URL');

if (!fsSync.existsSync(SQLITE_DB_PATH)) {
    throw new Error(`SQLite DB not found at ${SQLITE_DB_PATH}`);
}

const sqlite = new Database(SQLITE_DB_PATH, {readonly: true});

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY
    }
});

function log(message) {
    console.log(`[gallery migration] ${message}`);
}

function warn(message) {
    console.warn(`[gallery migration warning] ${message}`);
}

function tableExists(tableName) {
    const row = sqlite
        .prepare(
            `
                SELECT name
                FROM sqlite_master
                WHERE type = 'table'
                  AND name = ?
                LIMIT 1
            `
        )
        .get(tableName);

    return !!row;
}

function readTable(tableName) {
    if (!tableExists(tableName)) {
        warn(`SQLite table "${tableName}" does not exist. Skipping.`);
        return [];
    }

    return sqlite.prepare(`SELECT *
                           FROM ${tableName}`).all();
}

function decodeRepeated(value) {
    let current = String(value || '').trim();

    for (let i = 0; i < 5; i += 1) {
        try {
            const decoded = decodeURIComponent(current);

            if (decoded === current) return decoded;

            current = decoded;
        } catch {
            return current;
        }
    }

    return current;
}

function safeFilename(value) {
    return String(value || '')
        .split('/')
        .pop()
        ?.split('?')[0]
        ?.split('#')[0]
        ?.replace(/[^\w.-]+/g, '-') || `${randomUUID()}.bin`;
}

function safeId(value) {
    return String(value || '')
        .trim()
        .replaceAll('/', '')
        .replaceAll('\\', '')
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function publicR2Url(key) {
    return `${R2_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key
        .split('/')
        .map((part) => encodeURIComponent(part))
        .join('/')}`;
}

function inferKind(filenameOrUrl, mimeType = '') {
    const mime = String(mimeType || '').toLowerCase();
    const lower = String(filenameOrUrl || '').toLowerCase();

    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';

    if (/\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/.test(lower)) return 'image';
    if (/\.(mp4|webm|mov|m4v)(\?.*)?$/.test(lower)) return 'video';

    return null;
}

function candidateLocalPaths(src) {
    const candidates = new Set();
    const raw = String(src || '').trim();

    if (!raw) return [];

    let pathname = raw;

    try {
        if (/^https?:\/\//i.test(raw)) {
            pathname = new URL(raw).pathname;
        }
    } catch {
        pathname = raw;
    }

    const clean = pathname.split('?')[0].split('#')[0];
    const decoded = decodeRepeated(clean);

    candidates.add(path.resolve(ROOT, 'static', clean.replace(/^\/+/, '')));
    candidates.add(path.resolve(ROOT, 'static', decoded.replace(/^\/+/, '')));

    if (!clean.includes('/')) {
        candidates.add(path.resolve(ROOT, 'static', 'uploads', clean));
        candidates.add(path.resolve(ROOT, 'static', 'uploads', decoded));
    }

    return [...candidates];
}

async function findLocalFile(src) {
    for (const candidate of candidateLocalPaths(src)) {
        try {
            const stat = await fs.stat(candidate);

            if (stat.isFile()) {
                return {
                    path: candidate,
                    size: stat.size
                };
            }
        } catch {
            // Try next candidate.
        }
    }

    return null;
}

async function getFfmpegPath() {
    if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;

    const mod = await import('ffmpeg-static');
    const candidate = mod.default || mod;

    if (!candidate || typeof candidate !== 'string') {
        throw new Error('FFmpeg binary not found. Install ffmpeg-static or set FFMPEG_PATH.');
    }

    return candidate;
}

async function processImageToWebp(input) {
    return sharp(input)
        .rotate()
        .resize({
            width: MAX_IMAGE_WIDTH,
            height: MAX_IMAGE_HEIGHT,
            fit: 'inside',
            withoutEnlargement: true
        })
        .webp({
            quality: IMAGE_WEBP_QUALITY,
            effort: 5
        })
        .toBuffer();
}

async function processVideoToWebm(input, originalFilename) {
    const ffmpegPath = await getFfmpegPath();
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gv-gallery-video-'));
    const inputExt = originalFilename.split('.').pop() || 'input';
    const inputPath = path.join(tempDir, `source.${inputExt}`);
    const outputPath = path.join(tempDir, 'output.webm');

    try {
        await fs.writeFile(inputPath, input);

        await execFileAsync(
            ffmpegPath,
            [
                '-y',
                '-i',
                inputPath,
                '-vf',
                `scale=w=${MAX_VIDEO_WIDTH}:h=${MAX_VIDEO_HEIGHT}:force_original_aspect_ratio=decrease,setsar=1`,
                '-c:v',
                'libvpx-vp9',
                '-b:v',
                '0',
                '-crf',
                VIDEO_CRF,
                '-row-mt',
                '1',
                '-deadline',
                'good',
                '-cpu-used',
                VIDEO_CPU_USED,
                '-c:a',
                'libopus',
                '-b:a',
                '96k',
                outputPath
            ],
            {
                maxBuffer: 1024 * 1024 * 20
            }
        );

        return await fs.readFile(outputPath);
    } finally {
        await fs.rm(tempDir, {
            recursive: true,
            force: true
        });
    }
}

async function processGalleryFile(localPath, originalFilename) {
    const source = await fs.readFile(localPath);
    const kind = inferKind(originalFilename);

    if (kind === 'image') {
        const bytes = await processImageToWebp(source);

        return {
            type: 'image',
            bytes,
            mimeType: 'image/webp',
            ext: 'webp'
        };
    }

    if (kind === 'video') {
        const bytes = await processVideoToWebm(source, originalFilename);

        return {
            type: 'video',
            bytes,
            mimeType: 'video/webm',
            ext: 'webm'
        };
    }

    return null;
}

async function uploadProcessedToR2({itemId, bytes, mimeType, ext}) {
    const key = `gallery/${itemId}/${randomUUID()}.${ext}`;
    const url = publicR2Url(key);

    if (DRY_RUN) {
        log(`[dry-run] Would upload processed ${mimeType} → r2://${R2_BUCKET}/${key}`);
        return {
            url,
            key
        };
    }

    await r2.send(
        new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: bytes,
            ContentType: mimeType,
            CacheControl: 'public, max-age=31536000, immutable'
        })
    );

    return {
        url,
        key
    };
}

function tagsByItemId() {
    const map = new Map();

    if (!tableExists('gallery_item_tags') || !tableExists('gallery_tags')) {
        return map;
    }

    const rows = sqlite
        .prepare(
            `
                SELECT it.item_id, t.name
                FROM gallery_item_tags it
                         JOIN gallery_tags t ON t.id = it.tag_id
                ORDER BY t.name ASC
            `
        )
        .all();

    for (const row of rows) {
        const itemId = String(row.item_id || '');
        const tag = String(row.name || '').trim();

        if (!itemId || !tag) continue;

        const existing = map.get(itemId) || [];
        existing.push(tag);
        map.set(itemId, existing);
    }

    return map;
}

async function upsertSupabaseGalleryItem(item) {
    if (DRY_RUN) {
        log(`[dry-run] Would upsert gallery item: ${JSON.stringify(item).slice(0, 300)}...`);
        return;
    }

    const {error} = await supabase
        .from('gallery_items')
        .upsert(
            {
                id: item.id,
                type: item.type,
                src: item.src,
                src_webp: item.type === 'image' ? item.src : '',
                src_jpg: '',
                alt: item.alt || '',
                updated_at: new Date().toISOString()
            },
            {
                onConflict: 'id'
            }
        );

    if (error) {
        throw new Error(`Supabase upsert gallery_items failed: ${error.message}`);
    }
}

async function ensureSupabaseTag(name) {
    if (DRY_RUN) {
        return {
            id: 0,
            name
        };
    }

    const {data, error} = await supabase
        .from('gallery_tags')
        .upsert(
            {
                name
            },
            {
                onConflict: 'name'
            }
        )
        .select('id, name')
        .single();

    if (error) {
        throw new Error(`Supabase upsert gallery_tags failed: ${error.message}`);
    }

    return data;
}

async function replaceSupabaseTags(itemId, tags) {
    if (DRY_RUN) {
        if (tags.length) {
            log(`[dry-run] Would set tags for ${itemId}: ${tags.join(', ')}`);
        }

        return;
    }

    const {error: deleteError} = await supabase
        .from('gallery_item_tags')
        .delete()
        .eq('item_id', itemId);

    if (deleteError) {
        throw new Error(`Supabase delete gallery_item_tags failed: ${deleteError.message}`);
    }

    for (const tagName of tags) {
        const tag = await ensureSupabaseTag(tagName);

        if (!tag?.id) continue;

        const {error: joinError} = await supabase
            .from('gallery_item_tags')
            .upsert(
                {
                    item_id: itemId,
                    tag_id: tag.id
                },
                {
                    onConflict: 'item_id,tag_id'
                }
            );

        if (joinError) {
            throw new Error(`Supabase upsert gallery_item_tags failed: ${joinError.message}`);
        }
    }
}

async function migrateGallery() {
    const rows = readTable('gallery_items');
    const tagMap = tagsByItemId();

    if (!rows.length) {
        log('No gallery items found in SQLite.');
        return;
    }

    log(`Migrating ${rows.length} gallery item(s)...`);

    for (const row of rows) {
        const id = safeId(row.id || `g-${randomUUID()}`);
        const src = row.src_webp || row.src || row.src_jpg || '';

        if (!src) {
            warn(`Skipping gallery item "${id}" because it has no source file.`);
            continue;
        }

        if (String(src).startsWith(R2_PUBLIC_BASE_URL)) {
            await upsertSupabaseGalleryItem({
                id,
                type: row.type || 'image',
                src,
                alt: row.alt || ''
            });

            await replaceSupabaseTags(id, tagMap.get(row.id) || []);
            log(`Gallery item already on R2: ${id}`);
            continue;
        }

        const localFile = await findLocalFile(src);

        if (!localFile) {
            warn(`Skipping gallery item "${id}" because local file was not found: ${src}`);
            continue;
        }

        const originalFilename = safeFilename(src);
        const processed = await processGalleryFile(localFile.path, originalFilename);

        if (!processed) {
            warn(`Skipping gallery item "${id}" because media type is unsupported: ${src}`);
            continue;
        }

        const uploaded = await uploadProcessedToR2({
            itemId: id,
            bytes: processed.bytes,
            mimeType: processed.mimeType,
            ext: processed.ext
        });

        await upsertSupabaseGalleryItem({
            id,
            type: processed.type,
            src: uploaded.url,
            alt: row.alt || ''
        });

        await replaceSupabaseTags(id, tagMap.get(row.id) || []);

        log(`Gallery item: ${id} → ${uploaded.url}`);
    }
}

async function main() {
    log(`SQLite DB: ${SQLITE_DB_PATH}`);
    log(`Supabase: ${SUPABASE_URL}`);
    log(`R2 bucket: ${R2_BUCKET}`);
    log(`R2 public base URL: ${R2_PUBLIC_BASE_URL}`);

    if (DRY_RUN) {
        log('DRY_RUN=true, no writes will be performed.');
    }

    await migrateGallery();

    log('Gallery migration complete.');
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => {
        sqlite.close();
    });