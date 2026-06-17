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

const IMAGE_WEBP_QUALITY = Number(process.env.GALLERY_WEBP_QUALITY || 78);
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
                select name
                from sqlite_master
                where type = 'table'
                  and name = ?
                limit 1
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

    return sqlite.prepare(`select *
                           from ${tableName}`).all();
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

function decodeHtmlBasic(value) {
    return String(value || '')
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#039;', "'")
        .replaceAll('&#8211;', '–')
        .replaceAll('&#8212;', '—')
        .replaceAll('&#215;', '×');
}

function safeFilename(value) {
    return (
        String(value || '')
            .split('/')
            .pop()
            ?.split('?')[0]
            ?.split('#')[0]
            ?.replace(/[^\w.-]+/g, '-') || `${randomUUID()}.bin`
    );
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

    if (/\.(png|jpe?g|webp|gif|avif|heic|heif)(\?.*)?$/.test(lower)) return 'image';
    if (/\.(mp4|webm|mov|m4v)(\?.*)?$/.test(lower)) return 'video';

    return null;
}

function imageExtension(filenameOrUrl) {
    const lower = String(filenameOrUrl || '').toLowerCase();

    return /\.(png|jpe?g|webp|gif|avif|heic|heif)(\?.*)?$/.test(lower);
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
                return candidate;
            }
        } catch {
            // Try next candidate.
        }
    }

    return null;
}

function stripVariantSuffix(stem) {
    return String(stem || '')
        .replace(/[-_](480|960|1440)(w)?$/i, '')
        .replace(/[-_](480|960|1440)x\d+$/i, '')
        .replace(/[-_]\d+x(480|960|1440)$/i, '')
        .replace(/[-_]\d+x\d+$/i, '');
}

async function metadataWidth(filePath) {
    try {
        const metadata = await sharp(filePath).metadata();

        return metadata.width || 0;
    } catch {
        return 0;
    }
}

async function findBestImageVariant(sourcePath, targetWidth) {
    const sourceDir = path.dirname(sourcePath);
    const sourceExt = path.extname(sourcePath);
    const sourceStem = path.basename(sourcePath, sourceExt);
    const sourceBase = stripVariantSuffix(sourceStem);

    let files = [];

    try {
        files = await fs.readdir(sourceDir);
    } catch {
        return sourcePath;
    }

    const candidates = files
        .filter((file) => imageExtension(file))
        .map((file) => path.join(sourceDir, file))
        .filter((filePath) => {
            const ext = path.extname(filePath);
            const stem = path.basename(filePath, ext);
            return stripVariantSuffix(stem) === sourceBase;
        });

    let best = {
        filePath: sourcePath,
        score: Number.POSITIVE_INFINITY
    };

    for (const candidate of candidates) {
        const width = await metadataWidth(candidate);

        if (!width) continue;

        const score = Math.abs(width - targetWidth);

        if (score < best.score) {
            best = {
                filePath: candidate,
                score
            };
        }
    }

    if (best.score <= Math.max(120, targetWidth * 0.25)) {
        return best.filePath;
    }

    return sourcePath;
}

async function processImageVariant(sourcePath, targetWidth) {
    const input = await fs.readFile(sourcePath);

    const output = await sharp(input)
        .rotate()
        .resize({
            width: targetWidth,
            fit: 'inside',
            withoutEnlargement: true
        })
        .webp({
            quality: IMAGE_WEBP_QUALITY,
            effort: 5
        })
        .toBuffer();

    const metadata = await sharp(output).metadata();

    return {
        bytes: output,
        width: metadata.width || null,
        height: metadata.height || null
    };
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

async function processVideoToWebm(inputPath) {
    const ffmpegPath = await getFfmpegPath();
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gv-gallery-video-'));
    const outputPath = path.join(tempDir, 'output.webm');

    try {
        await execFileAsync(
            ffmpegPath,
            [
                '-y',
                '-i',
                inputPath,
                '-vf',
                'scale=w=1280:h=720:force_original_aspect_ratio=decrease,setsar=1',
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

async function uploadBytesToR2({key, bytes, contentType}) {
    const url = publicR2Url(key);

    if (DRY_RUN) {
        log(`[dry-run] Would upload processed ${contentType} → r2://${R2_BUCKET}/${key}`);
        return url;
    }

    await r2.send(
        new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: bytes,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000, immutable'
        })
    );

    return url;
}

function tagsByItemId() {
    const map = new Map();

    if (!tableExists('gallery_item_tags') || !tableExists('gallery_tags')) {
        return map;
    }

    const rows = sqlite
        .prepare(
            `
                select it.item_id, t.name
                from gallery_item_tags it
                         join gallery_tags t on t.id = it.tag_id
                order by t.name asc
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
                src_480: item.src480 || '',
                src_960: item.src960 || '',
                video_src: item.videoSrc || '',
                alt: item.alt || '',
                width: item.width ?? null,
                height: item.height ?? null,
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
            {name},
            {onConflict: 'name'}
        )
        .select('id, name')
        .single();

    if (error) {
        throw new Error(`Supabase upsert gallery_tags failed: ${error.message}`);
    }

    return data;
}

async function replaceSupabaseTags(itemId, tags) {
    const uniqueTags = [...new Set(tags.map((tag) => String(tag || '').trim()).filter(Boolean))];

    if (DRY_RUN) {
        if (uniqueTags.length) {
            log(`[dry-run] Would set tags for ${itemId}: ${uniqueTags.join(', ')}`);
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

    for (const tagName of uniqueTags) {
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

async function migrateImageItem({id, src, alt}) {
    const localFile = await findLocalFile(src);

    if (!localFile) {
        warn(`Skipping gallery item "${id}" because local file was not found: ${src}`);
        return null;
    }

    const source480 = await findBestImageVariant(localFile, 480);
    const source960 = await findBestImageVariant(localFile, 960);

    const variant480 = await processImageVariant(source480, 480);
    const variant960 = await processImageVariant(source960, 960);

    const batchId = randomUUID();

    const src480 = await uploadBytesToR2({
        key: `gallery/${id}/${batchId}-480.webp`,
        bytes: variant480.bytes,
        contentType: 'image/webp'
    });

    const src960 = await uploadBytesToR2({
        key: `gallery/${id}/${batchId}-960.webp`,
        bytes: variant960.bytes,
        contentType: 'image/webp'
    });

    return {
        id,
        type: 'image',
        src480,
        src960,
        videoSrc: '',
        alt,
        width: variant960.width,
        height: variant960.height
    };
}

async function migrateVideoItem({id, src, alt}) {
    const localFile = await findLocalFile(src);

    if (!localFile) {
        warn(`Skipping gallery video "${id}" because local file was not found: ${src}`);
        return null;
    }

    const bytes = await processVideoToWebm(localFile);
    const batchId = randomUUID();

    const videoSrc = await uploadBytesToR2({
        key: `gallery/${id}/${batchId}.webm`,
        bytes,
        contentType: 'video/webm'
    });

    return {
        id,
        type: 'video',
        src480: '',
        src960: '',
        videoSrc,
        alt,
        width: null,
        height: null
    };
}

async function migrateGallery() {
    const rows = readTable('gallery_items');
    const tagMap = tagsByItemId();

    if (!rows.length) {
        log('No gallery items found in SQLite.');
        return;
    }

    log(`Migrating ${rows.length} gallery item(s)...`);

    let migrated = 0;
    let skipped = 0;

    for (const row of rows) {
        const id = safeId(row.id || `g-${randomUUID()}`);
        const src = row.src || row.src_webp || row.src_jpg || '';
        const alt = decodeHtmlBasic(row.alt || safeFilename(src));

        if (!src) {
            warn(`Skipping gallery item "${id}" because it has no source file.`);
            skipped += 1;
            continue;
        }

        const kind = inferKind(src, row.type);

        try {
            let item = null;

            if (kind === 'image') {
                item = await migrateImageItem({id, src, alt});
            } else if (kind === 'video') {
                item = await migrateVideoItem({id, src, alt});
            } else {
                warn(`Skipping gallery item "${id}" because media type is unsupported: ${src}`);
                skipped += 1;
                continue;
            }

            if (!item) {
                skipped += 1;
                continue;
            }

            await upsertSupabaseGalleryItem(item);
            await replaceSupabaseTags(id, tagMap.get(row.id) || []);

            migrated += 1;

            if (item.type === 'image') {
                log(`Gallery item: ${id} → 480=${item.src480}, 960=${item.src960}`);
            } else {
                log(`Gallery item: ${id} → ${item.videoSrc}`);
            }
        } catch (error) {
            warn(
                `Skipping gallery item "${id}" because processing failed: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
            skipped += 1;
        }
    }

    log(`Migrated ${migrated} gallery item(s), skipped ${skipped}.`);
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