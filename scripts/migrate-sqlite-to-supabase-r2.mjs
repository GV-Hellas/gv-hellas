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

const TRANSLATE_MISSING_DE = process.env.TRANSLATE_MISSING_DE === 'true';
const TRANSLATE_IN_DRY_RUN = process.env.TRANSLATE_IN_DRY_RUN === 'true';
const DEEPL_API_KEY = process.env.DEEPL_API_KEY || '';
const DEEPL_API_URL = process.env.DEEPL_API_URL || 'https://api-free.deepl.com/v2/translate';

const MAX_IMAGE_WIDTH = 1280;
const MAX_IMAGE_HEIGHT = 720;
const IMAGE_WEBP_QUALITY = 78;

const MAX_VIDEO_WIDTH = 1280;
const MAX_VIDEO_HEIGHT = 720;
const VIDEO_CRF = process.env.CMS_VIDEO_CRF || '34';
const VIDEO_CPU_USED = process.env.CMS_VIDEO_CPU_USED || '5';

const EVENT_CATEGORIES = new Set(['general', 'dance', 'kids', 'assembly', 'celebration']);
const GREEK_RE = /[\u0370-\u03ff]/;

const MEDIA_URL_RE =
    /(?:https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|webp|gif|avif|svg|mp4|webm|mov|m4v)(?:\?[^\s"'<>]+)?|\/?uploads\/[^\s"'<>]+\.(?:png|jpe?g|webp|gif|avif|svg|mp4|webm|mov|m4v)(?:\?[^\s"'<>]+)?)/gi;

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

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY
    }
});

const db = new Database(SQLITE_DB_PATH, {readonly: true});

const slugMap = {
    events: {},
    businesses: {},
    links: {}
};

const translationCache = new Map();

function log(message) {
    console.log(`[migration] ${message}`);
}

function warn(message) {
    console.warn(`[migration warning] ${message}`);
}

function tableExists(tableName) {
    const row = db
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

    return db.prepare(`SELECT *
                       FROM ${tableName}`).all();
}

function parseJson(value, fallback) {
    if (typeof value !== 'string' || !value.trim()) return fallback;

    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

function nullableNumber(value) {
    if (value === null || value === undefined || value === '') return null;

    const n = Number(value);
    return Number.isFinite(n) ? n : null;
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

function htmlDecodeBasic(value) {
    return String(value || '')
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#039;', "'")
        .replaceAll('&#8211;', '–')
        .replaceAll('&#8212;', '—')
        .replaceAll('&#038;', '&');
}

function stripHtml(value) {
    return htmlDecodeBasic(value)
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function swissGerman(value) {
    return String(value || '').replaceAll('ß', 'ss').replaceAll('ẞ', 'SS');
}

function stripUrlParts(value) {
    let input = String(value || '').trim();

    if (!input) return '';

    try {
        if (/^https?:\/\//i.test(input)) {
            input = new URL(input).pathname;
        }
    } catch {
        // Keep original input.
    }

    input = input.split('?')[0].split('#')[0];

    const last = input.split('/').filter(Boolean).pop() || input;

    return last.replace(/\.json$/i, '');
}

function stripGreekAccents(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function greeklish(value) {
    let text = stripGreekAccents(htmlDecodeBasic(value)).toLowerCase();

    const multi = [
        ['αι', 'ai'],
        ['ει', 'i'],
        ['οι', 'i'],
        ['υι', 'i'],
        ['ου', 'ou'],
        ['αυ', 'av'],
        ['ευ', 'ev'],
        ['ηυ', 'iv'],
        ['μπ', 'b'],
        ['ντ', 'd'],
        ['γκ', 'g'],
        ['γγ', 'g'],
        ['τσ', 'ts'],
        ['τζ', 'tz']
    ];

    for (const [from, to] of multi) {
        text = text.replaceAll(from, to);
    }

    const single = {
        'α': 'a',
        'β': 'v',
        'γ': 'g',
        'δ': 'd',
        'ε': 'e',
        'ζ': 'z',
        'η': 'i',
        'θ': 'th',
        'ι': 'i',
        'κ': 'k',
        'λ': 'l',
        'μ': 'm',
        'ν': 'n',
        'ξ': 'x',
        'ο': 'o',
        'π': 'p',
        'ρ': 'r',
        'σ': 's',
        'ς': 's',
        'τ': 't',
        'υ': 'y',
        'φ': 'f',
        'χ': 'ch',
        'ψ': 'ps',
        'ω': 'o'
    };

    return text.replace(/[α-ω]/g, (letter) => single[letter] || letter);
}

function slugifyText(value) {
    return greeklish(stripHtml(value))
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .toLowerCase()
        .replace(/[_\s]+/g, '-')
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 120);
}

function slugifyGreeklish(value) {
    const decoded = decodeRepeated(stripUrlParts(value));
    return slugifyText(decoded);
}

function eventSlugFrom(oldSlug, titleEl, titleDe) {
    return slugifyGreeklish(oldSlug) || slugifyText(titleEl) || slugifyText(titleDe) || `event-${randomUUID()}`;
}

function safePlainSlug(value) {
    return String(value || '')
        .trim()
        .replace(/\.json$/i, '')
        .replaceAll('/', '')
        .replaceAll('\\', '');
}

function withoutDuplicateSuffix(slug) {
    const value = String(slug || '');
    const match = value.match(/-(\d+)$/);
    if (!match) {
        return value;
    }

    const n = Number(match[1]);

    // Keep real years and meaningful dates.
    if (n >= 1900 && n <= 2100) {
        return value;
    }

    // Only strip small generated duplicate suffixes like -2, -3, -4.
    if (n >= 2 && n <= 50) {
        return value.replace(/-\d+$/, '');
    }
    
    return value;
}

function normalizeEventCategory(value) {
    const category = String(value || '').trim();

    if (EVENT_CATEGORIES.has(category)) return category;
    if (category === 'party') return 'celebration';
    if (category === 'religion') return 'celebration';
    if (category === 'music') return 'celebration';
    if (category === 'culture') return 'celebration';
    if (category === 'meeting') return 'assembly';

    return 'general';
}

function uniqueSlug(baseSlug, usedSet) {
    const cleanBase = baseSlug || `item-${randomUUID()}`;
    let candidate = cleanBase;
    let counter = 2;

    while (usedSet.has(candidate)) {
        candidate = `${cleanBase}-${counter}`;
        counter += 1;
    }

    usedSet.add(candidate);
    return candidate;
}

function inferKindFromMimeOrName(mimeType, filename) {
    if (String(mimeType || '').startsWith('image/')) return 'image';
    if (String(mimeType || '').startsWith('video/')) return 'video';

    const lower = String(filename || '').toLowerCase();

    if (/\.(mp4|webm|mov|m4v)$/.test(lower)) return 'video';
    if (/\.(png|jpe?g|webp|gif|avif|svg)$/.test(lower)) return 'image';

    return null;
}

function inferMediaTypeFromUrl(url) {
    const lower = String(url || '').toLowerCase();

    if (/\.(webm|mp4|mov|m4v)(\?.*)?$/.test(lower)) return 'video';
    return 'image';
}

function extensionFromContentType(contentType) {
    const clean = String(contentType || '').split(';')[0].trim().toLowerCase();

    switch (clean) {
        case 'image/jpeg':
            return 'jpg';
        case 'image/png':
            return 'png';
        case 'image/webp':
            return 'webp';
        case 'image/gif':
            return 'gif';
        case 'image/avif':
            return 'avif';
        case 'image/svg+xml':
            return 'svg';
        case 'video/mp4':
            return 'mp4';
        case 'video/webm':
            return 'webm';
        case 'video/quicktime':
            return 'mov';
        default:
            return '';
    }
}

function publicR2Url(key) {
    return `${R2_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key
        .split('/')
        .map((part) => encodeURIComponent(part))
        .join('/')}`;
}

function objectFilenameFromUrl(url, fallback = '') {
    const clean = String(url || fallback || '').split('?')[0].split('#')[0];
    const name = clean.split('/').filter(Boolean).pop() || fallback || `${randomUUID()}.bin`;

    return decodeRepeated(name).replace(/[^\w.-]+/g, '-');
}

function extractMediaUrls(value) {
    const text = String(value || '');
    const matches = [...text.matchAll(MEDIA_URL_RE)].map((match) => match[0]);

    return [...new Set(matches.map((url) => url.trim()).filter(Boolean))];
}

function removeMediaUrls(value) {
    return String(value || '').replace(MEDIA_URL_RE, '').replace(/\s+/g, ' ').trim();
}

function isHttpUrl(value) {
    return /^https?:\/\//i.test(String(value || ''));
}

function candidateLocalPaths(sourceUrl, context) {
    const candidates = new Set();
    const raw = String(sourceUrl || '').trim();

    if (!raw) return [];

    let pathname = raw;

    try {
        if (/^https?:\/\//i.test(raw)) {
            pathname = new URL(raw).pathname;
        }
    } catch {
        pathname = raw;
    }

    const noQuery = pathname.split('?')[0].split('#')[0];
    const decoded = decodeRepeated(noQuery);

    candidates.add(path.resolve(ROOT, 'static', noQuery.replace(/^\/+/, '')));
    candidates.add(path.resolve(ROOT, 'static', decoded.replace(/^\/+/, '')));

    if (context?.kind && context?.oldSlug) {
        const filename = objectFilenameFromUrl(sourceUrl, context.preferredFilename);
        const decodedOldSlug = decodeRepeated(context.oldSlug);

        const oldSlugVariants = [
            context.oldSlug,
            decodedOldSlug,
            encodeURIComponent(decodedOldSlug),
            slugifyGreeklish(decodedOldSlug),
            context.newSlug
        ].filter(Boolean);

        for (const slugVariant of oldSlugVariants) {
            candidates.add(path.resolve(ROOT, 'static', 'uploads', context.kind, slugVariant, filename));
            candidates.add(path.resolve(ROOT, 'static', 'uploads', context.kind, decodeRepeated(slugVariant), filename));
        }
    }

    return [...candidates];
}

async function findLocalFile(sourceUrl, context) {
    const candidates = candidateLocalPaths(sourceUrl, context);

    for (const candidate of candidates) {
        try {
            const stat = await fs.stat(candidate);

            if (stat.isFile()) {
                return {
                    path: candidate,
                    size: stat.size
                };
            }
        } catch {
            // Continue.
        }
    }

    return null;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 30_000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, {
            ...options,
            redirect: 'follow',
            signal: controller.signal
        });
    } finally {
        clearTimeout(timer);
    }
}

async function probeRemoteFile(sourceUrl) {
    try {
        const head = await fetchWithTimeout(sourceUrl, {method: 'HEAD'}, 12_000);

        if (head.ok) {
            return {
                ok: true,
                contentType: head.headers.get('content-type') || '',
                size: Number(head.headers.get('content-length') || 0)
            };
        }
    } catch {
        // Try ranged GET below.
    }

    try {
        const response = await fetchWithTimeout(
            sourceUrl,
            {
                method: 'GET',
                headers: {
                    Range: 'bytes=0-0'
                }
            },
            12_000
        );

        if (response.ok || response.status === 206) {
            return {
                ok: true,
                contentType: response.headers.get('content-type') || '',
                size: Number(response.headers.get('content-length') || 0)
            };
        }
    } catch {
        // Unavailable.
    }

    return {
        ok: false,
        contentType: '',
        size: 0
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

async function processImageBufferToWebp(input) {
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

async function processVideoBufferToWebm(input, originalFilename) {
    const ffmpegPath = await getFfmpegPath();
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gv-hellas-video-'));
    const sourceExt = originalFilename.split('.').pop() || 'input';
    const inputPath = path.join(tempDir, `source.${sourceExt}`);
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

async function processMediaBuffer(input, originalFilename, contentType) {
    const kind = inferKindFromMimeOrName(contentType, originalFilename);

    if (kind === 'image') {
        const bytes = await processImageBufferToWebp(input);
        return {
            bytes,
            filename: `${slugifyText(originalFilename.replace(/\.[^.]+$/, '')) || crypto.randomUUID()}.webp`,
            mimeType: 'image/webp',
            type: 'image'
        };
    }

    if (kind === 'video') {
        const bytes = await processVideoBufferToWebm(input, originalFilename);
        return {
            bytes,
            filename: `${slugifyText(originalFilename.replace(/\.[^.]+$/, '')) || crypto.randomUUID()}.webm`,
            mimeType: 'video/webm',
            type: 'video'
        };
    }

    return null;
}

async function uploadBufferToR2(buffer, key, contentType) {
    const url = publicR2Url(key);

    if (DRY_RUN) {
        log(`[dry-run] Would upload processed ${contentType} → r2://${R2_BUCKET}/${key}`);
        return {
            url,
            key
        };
    }

    await r2.send(
        new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000, immutable'
        })
    );

    return {
        url,
        key
    };
}

async function readSourceMedia(sourceUrl, options) {
    const originalFilename = objectFilenameFromUrl(sourceUrl, options.preferredFilename);
    const local = await findLocalFile(sourceUrl, options);

    if (local) {
        const bytes = await fs.readFile(local.path);
        return {
            bytes,
            originalFilename,
            contentType: inferKindFromMimeOrName('', originalFilename) === 'video' ? 'video/mp4' : 'image/jpeg',
            originalSize: local.size
        };
    }

    if (!isHttpUrl(sourceUrl)) {
        warn(`Local media file not found for "${sourceUrl}". Dropping it.`);
        return null;
    }

    const probe = await probeRemoteFile(sourceUrl);

    if (!probe.ok) {
        warn(`Remote media is unavailable: "${sourceUrl}". Dropping it.`);
        return null;
    }

    if (DRY_RUN) {
        return {
            bytes: Buffer.from('dry-run'),
            originalFilename,
            contentType: probe.contentType || '',
            originalSize: probe.size || 0,
            dryRunRemote: true
        };
    }

    const response = await fetchWithTimeout(sourceUrl, {method: 'GET'}, 60_000);

    if (!response.ok) {
        warn(`Remote media could not be downloaded: "${sourceUrl}". Dropping it.`);
        return null;
    }

    const arrayBuffer = await response.arrayBuffer();

    return {
        bytes: Buffer.from(arrayBuffer),
        originalFilename,
        contentType: response.headers.get('content-type') || probe.contentType || '',
        originalSize: Number(response.headers.get('content-length') || 0)
    };
}

async function migrateMediaUrlToR2(sourceUrl, options) {
    const source = String(sourceUrl || '').trim();

    if (!source) return null;

    if (source.startsWith(R2_PUBLIC_BASE_URL)) {
        return {
            url: source,
            filename: objectFilenameFromUrl(source),
            originalFilename: objectFilenameFromUrl(source),
            mimeType: inferMediaTypeFromUrl(source) === 'video' ? 'video/webm' : 'image/webp',
            size: 0,
            type: inferMediaTypeFromUrl(source)
        };
    }

    const sourceMedia = await readSourceMedia(source, options);

    if (!sourceMedia) return null;

    const kind = inferKindFromMimeOrName(sourceMedia.contentType, sourceMedia.originalFilename);

    if (!kind) {
        warn(`Unsupported media type for "${source}". Dropping it.`);
        return null;
    }

    const processed = sourceMedia.dryRunRemote
        ? {
            bytes: Buffer.from('dry-run'),
            filename: `${slugifyText(sourceMedia.originalFilename.replace(/\.[^.]+$/, '')) || randomUUID()}.${
                kind === 'video' ? 'webm' : 'webp'
            }`,
            mimeType: kind === 'video' ? 'video/webm' : 'image/webp',
            type: kind
        }
        : await processMediaBuffer(sourceMedia.bytes, sourceMedia.originalFilename, sourceMedia.contentType);

    if (!processed) return null;

    const storedFilename = `${randomUUID()}.${processed.type === 'video' ? 'webm' : 'webp'}`;
    const key = `${options.kind}/${options.newSlug}/${storedFilename}`;

    const uploaded = await uploadBufferToR2(processed.bytes, key, processed.mimeType);

    return {
        url: uploaded.url,
        filename: storedFilename,
        originalFilename: sourceMedia.originalFilename,
        mimeType: processed.mimeType,
        size: processed.bytes.byteLength,
        type: processed.type
    };
}

async function migrateMediaObject(media, options, stats) {
    const sourceUrl = media?.url || media?.src || '';

    if (!sourceUrl) return null;

    stats.originalMediaCount += 1;

    const uploaded = await migrateMediaUrlToR2(sourceUrl, {
        ...options,
        preferredFilename: media.filename || media.originalFilename
    });

    if (!uploaded) {
        stats.droppedMediaCount += 1;
        return null;
    }

    stats.migratedMediaCount += 1;

    return {
        ...media,
        id: media.id || randomUUID(),
        type: uploaded.type,
        url: uploaded.url,
        filename: uploaded.filename,
        originalFilename: media.originalFilename || uploaded.originalFilename,
        mimeType: uploaded.mimeType,
        size: uploaded.size
    };
}

async function rewriteHtmlMediaUrls(html, options, stats) {
    let output = String(html || '');
    const urls = [...new Set(extractMediaUrls(output))];

    for (const url of urls) {
        stats.originalMediaCount += 1;

        const uploaded = await migrateMediaUrlToR2(url, options);

        if (!uploaded) {
            stats.droppedMediaCount += 1;
            output = output.split(url).join('');
            continue;
        }

        stats.migratedMediaCount += 1;
        output = output.split(url).join(uploaded.url);
    }

    return output;
}

function ensureSections(event) {
    if (Array.isArray(event.sections) && event.sections.length > 0) return event.sections;

    return [
        {
            id: randomUUID(),
            beforeHtml: {el: '', de: ''},
            media: [],
            afterHtml: {el: '', de: ''}
        }
    ];
}

function addLooseDescriptionMediaToFirstSection(event) {
    const sections = ensureSections(event);
    const firstSection = sections[0];
    const media = Array.isArray(firstSection.media) ? firstSection.media : [];

    const urls = [...extractMediaUrls(event.description.el), ...extractMediaUrls(event.description.de)];
    const existing = new Set(media.map((item) => item?.url || item?.src || '').filter(Boolean));

    for (const url of urls) {
        if (existing.has(url)) continue;

        existing.add(url);

        media.push({
            id: randomUUID(),
            type: inferMediaTypeFromUrl(url),
            url,
            filename: objectFilenameFromUrl(url),
            mimeType: '',
            alt: {
                el: event.title.el || '',
                de: event.title.de || event.title.el || ''
            }
        });
    }

    firstSection.media = media;
    event.sections = sections;

    event.description = {
        el: removeMediaUrls(event.description.el),
        de: removeMediaUrls(event.description.de)
    };

    return event;
}

async function migrateSectionsMedia(sections, options) {
    const normalizedSections = Array.isArray(sections) ? sections : [];
    const migrated = [];
    const stats = {
        originalMediaCount: 0,
        migratedMediaCount: 0,
        droppedMediaCount: 0
    };

    const sectionMediaSeen = new Set();

    for (const section of normalizedSections) {
        const mediaItems = Array.isArray(section.media) ? section.media : [];
        const migratedMedia = [];

        for (const media of mediaItems) {
            const source = media?.url || media?.src || '';

            if (!source || sectionMediaSeen.has(source)) continue;

            sectionMediaSeen.add(source);

            const migratedItem = await migrateMediaObject(media, options, stats);

            if (migratedItem) migratedMedia.push(migratedItem);
        }

        const beforeHtmlEl = await rewriteHtmlMediaUrls(section.beforeHtml?.el || '', options, stats);
        const beforeHtmlDe = await rewriteHtmlMediaUrls(section.beforeHtml?.de || '', options, stats);
        const afterHtmlEl = await rewriteHtmlMediaUrls(section.afterHtml?.el || '', options, stats);
        const afterHtmlDe = await rewriteHtmlMediaUrls(section.afterHtml?.de || '', options, stats);

        migrated.push({
            ...section,
            id: section.id || randomUUID(),
            beforeHtml: {
                el: beforeHtmlEl,
                de: beforeHtmlDe
            },
            media: migratedMedia,
            afterHtml: {
                el: afterHtmlEl,
                de: afterHtmlDe
            }
        });
    }

    return {sections: migrated, stats};
}

async function migrateSingleAssetUrl(sourceUrl, options) {
    const uploaded = await migrateMediaUrlToR2(sourceUrl, options);
    return uploaded?.url || '';
}

function normalizeEventFromRow(row) {
    const payload = parseJson(row.payload, null);

    if (payload && typeof payload === 'object') {
        return {
            oldSlug: payload.slug || row.slug || '',
            updatedAt: payload.updatedAt || row.updated_at || row.updatedAt || '',
            title: {
                el: payload.title?.el || row.title_el || '',
                de: payload.title?.de || row.title_de || ''
            },
            description: {
                el: payload.description?.el || row.description_el || row.excerpt_el || '',
                de: payload.description?.de || row.description_de || row.excerpt_de || ''
            },
            date: payload.date || row.date || '',
            time: payload.time || row.time || '',
            location: payload.location || row.location || '',
            category: normalizeEventCategory(payload.category || row.category),
            priceMembers: nullableNumber(payload.priceMembers ?? row.price_members),
            pricePublic: nullableNumber(payload.pricePublic ?? row.price_public),
            sections: Array.isArray(payload.sections) ? payload.sections : parseJson(row.sections, [])
        };
    }

    const sections = parseJson(row.sections, []);

    return {
        oldSlug: row.slug || '',
        updatedAt: row.updated_at || row.updatedAt || '',
        title: {
            el: row.title_el || '',
            de: row.title_de || ''
        },
        description: {
            el: row.description_el || row.excerpt_el || '',
            de: row.description_de || row.excerpt_de || ''
        },
        date: row.date || '',
        time: row.time || '',
        location: row.location || '',
        category: normalizeEventCategory(row.category),
        priceMembers: nullableNumber(row.price_members),
        pricePublic: nullableNumber(row.price_public),
        sections: sections.length
            ? sections
            : [
                {
                    id: randomUUID(),
                    beforeHtml: {
                        el: row.content_el || '',
                        de: row.content_de || ''
                    },
                    media: parseJson(row.media_blocks, []),
                    afterHtml: {
                        el: '',
                        de: ''
                    }
                }
            ]
    };
}

function normalizeLinkFromRow(row) {
    const payload = parseJson(row.payload, null);

    if (payload && typeof payload === 'object') {
        return {
            id: Number(row.id),
            name: {
                el: payload.name?.el || row.name_el || '',
                de: payload.name?.de || row.name_de || ''
            },
            descriptionHtml: {
                el: payload.descriptionHtml?.el || row.description_html_el || '',
                de: payload.descriptionHtml?.de || row.description_html_de || ''
            },
            url: payload.url || row.url || '',
            logo: payload.logo || row.logo || '',
            logoVariants: {
                webp: payload.logoVariants?.webp || row.logo_webp || '',
                jpg: payload.logoVariants?.jpg || row.logo_jpg || ''
            }
        };
    }

    return {
        id: Number(row.id),
        name: {
            el: row.name_el || '',
            de: row.name_de || ''
        },
        descriptionHtml: {
            el: row.description_html_el || '',
            de: row.description_html_de || ''
        },
        url: row.url || '',
        logo: row.logo || '',
        logoVariants: {
            webp: row.logo_webp || '',
            jpg: row.logo_jpg || ''
        }
    };
}

function normalizeBusinessFromRow(row) {
    const payload = parseJson(row.payload, null);

    if (payload && typeof payload === 'object') {
        return {
            id: Number(row.id),
            sponsorType: payload.sponsorType || row.sponsor_type || 'listed',
            name: payload.name || row.name || '',
            slug: payload.slug || row.slug || '',
            logo: payload.logo || row.logo || '',
            logoVariants: {
                webp: payload.logoVariants?.webp || row.logo_webp || '',
                jpg: payload.logoVariants?.jpg || row.logo_jpg || ''
            },
            description: {
                el: payload.description?.el || row.description_el || '',
                de: payload.description?.de || row.description_de || ''
            },
            url: payload.url || row.url || '',
            email: payload.email || row.email || '',
            telephone: payload.telephone || row.telephone || '',
            contactPerson: payload.contactPerson || row.contact_person || '',
            sections: Array.isArray(payload.sections) ? payload.sections : parseJson(row.sections, [])
        };
    }

    return {
        id: Number(row.id),
        sponsorType: row.sponsor_type || 'listed',
        name: row.name || '',
        slug: row.slug || '',
        logo: row.logo || '',
        logoVariants: {
            webp: row.logo_webp || '',
            jpg: row.logo_jpg || ''
        },
        description: {
            el: row.description_el || '',
            de: row.description_de || ''
        },
        url: row.url || '',
        email: row.email || '',
        telephone: row.telephone || '',
        contactPerson: row.contact_person || '',
        sections: parseJson(row.sections, [])
    };
}

function eventScore(event) {
    const sections = Array.isArray(event.sections) ? event.sections : [];
    const mediaCount = sections.reduce((sum, section) => sum + (Array.isArray(section.media) ? section.media.length : 0), 0);

    const textScore =
        String(event.title.el || '').length +
        String(event.description.el || '').length +
        sections.reduce(
            (sum, section) =>
                sum + String(section.beforeHtml?.el || '').length + String(section.afterHtml?.el || '').length,
            0
        );

    const updatedScore = event.updatedAt ? new Date(event.updatedAt).getTime() || 0 : 0;

    return mediaCount * 100_000 + textScore + updatedScore / 100_000_000;
}

function pickBetterValue(current, candidate) {
    const c = String(current || '').trim();
    const n = String(candidate || '').trim();

    if (!c) return n;
    if (!n) return c;
    if (n.length > c.length) return n;

    return c;
}

function mergeLocalized(current, candidate) {
    return {
        el: pickBetterValue(current?.el, candidate?.el),
        de: pickBetterValue(current?.de, candidate?.de)
    };
}

function mergeSections(sectionsList) {
    const result = [];
    const mediaSeen = new Set();

    for (const sections of sectionsList) {
        for (const section of Array.isArray(sections) ? sections : []) {
            const copied = {
                ...section,
                id: section.id || randomUUID(),
                beforeHtml: {
                    el: section.beforeHtml?.el || '',
                    de: section.beforeHtml?.de || ''
                },
                media: [],
                afterHtml: {
                    el: section.afterHtml?.el || '',
                    de: section.afterHtml?.de || ''
                }
            };

            for (const media of Array.isArray(section.media) ? section.media : []) {
                const key = media?.url || media?.src || media?.filename || JSON.stringify(media);

                if (!key || mediaSeen.has(key)) continue;

                mediaSeen.add(key);
                copied.media.push(media);
            }

            result.push(copied);
        }
    }

    return result;
}

function eventMergeInfo(event, baseSlug) {
    const baseWithoutSuffix = withoutDuplicateSuffix(baseSlug);
    const titleSlug = withoutDuplicateSuffix(slugifyText(event.title.el || event.title.de || ''));

    if (titleSlug && titleSlug === baseWithoutSuffix) {
        return {key: baseWithoutSuffix, preferredSlug: baseWithoutSuffix};
    }

    if (titleSlug && (titleSlug.includes(baseWithoutSuffix) || baseWithoutSuffix.includes(titleSlug))) {
        return {key: baseWithoutSuffix, preferredSlug: baseWithoutSuffix};
    }

    if (titleSlug) {
        return {key: `${baseSlug}::${titleSlug}`, preferredSlug: titleSlug};
    }

    return {key: baseSlug, preferredSlug: baseSlug};
}

function mergeEventGroup(records) {
    const sorted = [...records].sort((a, b) => eventScore(b.event) - eventScore(a.event));
    const primary = structuredClone(sorted[0].event);

    for (const record of sorted.slice(1)) {
        const event = record.event;

        primary.title = mergeLocalized(primary.title, event.title);
        primary.description = mergeLocalized(primary.description, event.description);
        primary.date = pickBetterValue(primary.date, event.date);
        primary.time = pickBetterValue(primary.time, event.time);
        primary.location = pickBetterValue(primary.location, event.location);
        primary.category = primary.category || event.category || 'general';
        primary.priceMembers = primary.priceMembers ?? event.priceMembers ?? null;
        primary.pricePublic = primary.pricePublic ?? event.pricePublic ?? null;
    }

    primary.sections = mergeSections(sorted.map((record) => record.event.sections));
    primary.oldSlugs = sorted.map((record) => record.event.oldSlug).filter(Boolean);
    primary.preferredSlug = sorted[0].preferredSlug;

    return primary;
}

function needsGermanTranslation(el, de) {
    const source = String(el || '').trim();
    const target = String(de || '').trim();

    if (!source) return false;
    if (!target) return true;
    if (target === source) return true;
    if (GREEK_RE.test(target)) return true;

    return false;
}

async function translateElToDe(value, {html = false} = {}) {
    const source = String(value || '');

    if (!source.trim()) return '';

    const cacheKey = `${html ? 'html' : 'text'}::${source}`;

    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey);
    }

    if (!TRANSLATE_MISSING_DE) {
        const fallback = swissGerman(source);
        translationCache.set(cacheKey, fallback);
        return fallback;
    }

    if (DRY_RUN && !TRANSLATE_IN_DRY_RUN) {
        log(`[dry-run] Would translate EL → DE: "${stripHtml(source).slice(0, 80)}"`);
        const fallback = swissGerman(source);
        translationCache.set(cacheKey, fallback);
        return fallback;
    }

    if (!DEEPL_API_KEY) {
        warn('DEEPL_API_KEY is not set. Keeping Greek source for missing German translation.');
        const fallback = swissGerman(source);
        translationCache.set(cacheKey, fallback);
        return fallback;
    }

    try {
        const body = {
            text: [source],
            source_lang: 'EL',
            target_lang: 'DE',
            formality: 'prefer_more'
        };

        if (html) {
            body.tag_handling = 'html';
            body.tag_handling_version = 'v2';
        }

        const response = await fetchWithTimeout(
            DEEPL_API_URL,
            {
                method: 'POST',
                headers: {
                    Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            },
            30_000
        );

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            warn(`DeepL translation failed: ${response.status} ${text}`);
            const fallback = swissGerman(source);
            translationCache.set(cacheKey, fallback);
            return fallback;
        }

        const data = await response.json();
        const translated = swissGerman(data?.translations?.[0]?.text || source);

        translationCache.set(cacheKey, translated);
        return translated;
    } catch (error) {
        warn(`Translation failed. Keeping Greek source. ${(error && error.message) || error}`);
        const fallback = swissGerman(source);
        translationCache.set(cacheKey, fallback);
        return fallback;
    }
}

async function translateLocalizedIfNeeded(localized, {html = false} = {}) {
    const el = String(localized?.el || '');
    const de = String(localized?.de || '');

    if (!needsGermanTranslation(el, de)) {
        return {el, de: swissGerman(de)};
    }

    return {el, de: await translateElToDe(el, {html})};
}

async function translateEventGermanFields(event) {
    event.title = await translateLocalizedIfNeeded(event.title, {html: false});
    event.description = await translateLocalizedIfNeeded(event.description, {html: false});

    event.sections = await Promise.all(
        ensureSections(event).map(async (section) => ({
            ...section,
            beforeHtml: await translateLocalizedIfNeeded(section.beforeHtml, {html: true}),
            media: section.media,
            afterHtml: await translateLocalizedIfNeeded(section.afterHtml, {html: true})
        }))
    );

    return event;
}

async function upsertSupabase(table, row, onConflict) {
    if (DRY_RUN) {
        log(`[dry-run] Would upsert ${table}: ${JSON.stringify(row).slice(0, 350)}...`);
        return;
    }

    const {error} = await supabase.from(table).upsert(row, {onConflict});

    if (error) {
        throw new Error(`Supabase upsert into "${table}" failed: ${error.message}`);
    }
}

function buildMergedEventRecords() {
    const rows = readTable('events');
    const groups = new Map();

    for (const row of rows) {
        const event = normalizeEventFromRow(row);
        const baseSlug = eventSlugFrom(event.oldSlug, event.title.el, event.title.de);
        const mergeInfo = eventMergeInfo(event, baseSlug);

        if (!groups.has(mergeInfo.key)) groups.set(mergeInfo.key, []);

        groups.get(mergeInfo.key).push({
            event,
            baseSlug,
            preferredSlug: mergeInfo.preferredSlug
        });
    }

    const merged = [];

    for (const [key, records] of groups.entries()) {
        if (records.length > 1) {
            log(`Merging ${records.length} event rows for duplicate key "${key}"`);

            for (const record of records) {
                log(`  - ${record.event.oldSlug}`);
            }
        }

        merged.push(mergeEventGroup(records));
    }

    return merged;
}

async function migrateEvents() {
    const events = buildMergedEventRecords();

    if (!events.length) {
        log('No events to migrate.');
        return;
    }

    const usedSlugs = new Set();

    log(`Migrating ${events.length} merged events...`);

    for (const eventInput of events) {
        const preferredSlug =
            eventInput.preferredSlug || eventSlugFrom(eventInput.oldSlug, eventInput.title.el, eventInput.title.de);

        const newSlug = uniqueSlug(preferredSlug, usedSlugs);
        const oldSlugLabel = eventInput.oldSlugs?.join(', ') || eventInput.oldSlug || newSlug;

        for (const oldSlug of eventInput.oldSlugs || [eventInput.oldSlug]) {
            if (!oldSlug) continue;

            slugMap.events[oldSlug] = newSlug;
            slugMap.events[decodeRepeated(oldSlug)] = newSlug;
        }

        const eventWithLooseMedia = addLooseDescriptionMediaToFirstSection(structuredClone(eventInput));

        const {sections, stats} = await migrateSectionsMedia(eventWithLooseMedia.sections, {
            kind: 'events',
            oldSlug: eventWithLooseMedia.oldSlug || eventInput.oldSlugs?.[0] || newSlug,
            newSlug
        });

        if (stats.originalMediaCount > 0 && stats.migratedMediaCount === 0) {
            warn(
                `Skipping event "${oldSlugLabel}" → "${newSlug}" because all ${stats.originalMediaCount} media item(s) are unavailable.`
            );
            continue;
        }

        const translatedEvent = await translateEventGermanFields({
            ...eventWithLooseMedia,
            sections
        });

        await upsertSupabase(
            'events',
            {
                slug: newSlug,
                date: translatedEvent.date || '',
                time: translatedEvent.time || '',
                title_el: translatedEvent.title.el || '',
                title_de: translatedEvent.title.de || translatedEvent.title.el || '',
                description_el: translatedEvent.description.el || '',
                description_de: translatedEvent.description.de || translatedEvent.description.el || '',
                location: translatedEvent.location || '',
                category: translatedEvent.category || 'general',
                price_members: translatedEvent.priceMembers,
                price_public: translatedEvent.pricePublic,
                sections: translatedEvent.sections,
                updated_at: new Date().toISOString()
            },
            'slug'
        );

        log(
            `Event: ${oldSlugLabel} → ${newSlug} ` +
            `(media: ${stats.migratedMediaCount}/${stats.originalMediaCount}, dropped: ${stats.droppedMediaCount})`
        );
    }
}

async function migrateLinks() {
    const rows = readTable('links');

    if (!rows.length) {
        log('No links to migrate.');
        return;
    }

    log(`Migrating ${rows.length} links...`);

    for (const row of rows) {
        const link = normalizeLinkFromRow(row);

        if (!link.url) {
            warn(`Skipping link ${link.id}: missing URL.`);
            continue;
        }

        const linkSlug = slugifyText(link.name.el || link.name.de || `link-${link.id}`) || `link-${link.id}`;

        const logo = await migrateSingleAssetUrl(link.logo, {
            kind: 'links',
            oldSlug: linkSlug,
            newSlug: linkSlug,
            preferredFilename: objectFilenameFromUrl(link.logo)
        });

        const logoWebp = await migrateSingleAssetUrl(link.logoVariants.webp, {
            kind: 'links',
            oldSlug: linkSlug,
            newSlug: linkSlug,
            preferredFilename: objectFilenameFromUrl(link.logoVariants.webp)
        });

        await upsertSupabase(
            'links',
            {
                name_el: link.name.el || '',
                name_de: needsGermanTranslation(link.name.el, link.name.de)
                    ? await translateElToDe(link.name.el, {html: false})
                    : swissGerman(link.name.de || ''),
                description_html_el: link.descriptionHtml.el || '',
                description_html_de: needsGermanTranslation(link.descriptionHtml.el, link.descriptionHtml.de)
                    ? await translateElToDe(link.descriptionHtml.el, {html: true})
                    : swissGerman(link.descriptionHtml.de || ''),
                url: link.url,
                logo,
                logo_webp: logoWebp,
                logo_jpg: '',
                updated_at: new Date().toISOString()
            },
            'url'
        );

        log(`Link: ${link.url}`);
    }
}

async function migrateBusinesses() {
    const rows = readTable('businesses');

    if (!rows.length) {
        log('No businesses to migrate.');
        return;
    }

    const usedSlugs = new Set();

    log(`Migrating ${rows.length} businesses...`);

    for (const row of rows) {
        const business = normalizeBusinessFromRow(row);

        if (!business.name) {
            warn(`Skipping business ${business.id}: missing name.`);
            continue;
        }

        const baseSlug = safePlainSlug(business.slug) || slugifyText(business.name) || `business-${business.id}`;
        const newSlug = uniqueSlug(baseSlug, usedSlugs);

        slugMap.businesses[business.slug || business.name] = newSlug;

        const logo = await migrateSingleAssetUrl(business.logo, {
            kind: 'businesses',
            oldSlug: business.slug || newSlug,
            newSlug,
            preferredFilename: objectFilenameFromUrl(business.logo)
        });

        const {sections} = await migrateSectionsMedia(business.sections, {
            kind: 'businesses',
            oldSlug: business.slug || newSlug,
            newSlug
        });

        const description = await translateLocalizedIfNeeded(business.description, {html: false});

        await upsertSupabase(
            'businesses',
            {
                sponsor_type: business.sponsorType || 'listed',
                name: business.name,
                slug: newSlug,
                logo,
                logo_webp: '',
                logo_jpg: '',
                description_el: description.el || '',
                description_de: description.de || '',
                url: business.url || '',
                email: business.email || '',
                telephone: business.telephone || '',
                contact_person: business.contactPerson || '',
                sections,
                updated_at: new Date().toISOString()
            },
            'slug'
        );

        log(`Business: ${business.name} → ${newSlug}`);
    }
}

async function writeSlugMap() {
    const outputPath = path.resolve(ROOT, 'migration-slug-map.json');

    await fs.writeFile(outputPath, JSON.stringify(slugMap, null, 2));

    log(`Wrote slug map to ${outputPath}`);
}

async function main() {
    log(`SQLite DB: ${SQLITE_DB_PATH}`);
    log(`Supabase: ${SUPABASE_URL}`);
    log(`R2 bucket: ${R2_BUCKET}`);
    log(`R2 public base URL: ${R2_PUBLIC_BASE_URL}`);

    if (DRY_RUN) log('DRY_RUN=true, no writes will be performed.');

    if (TRANSLATE_MISSING_DE) {
        log(DEEPL_API_KEY ? 'Greek → German translation is enabled with DeepL.' : 'Translation requested but DEEPL_API_KEY is missing.');

        if (DRY_RUN && !TRANSLATE_IN_DRY_RUN) {
            log('Translations are not executed during dry run. Set TRANSLATE_IN_DRY_RUN=true to test them.');
        }
    }

    await migrateEvents();
    await migrateLinks();
    await migrateBusinesses();
    await writeSlugMap();

    log('Migration complete.');
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => {
        db.close();
    });