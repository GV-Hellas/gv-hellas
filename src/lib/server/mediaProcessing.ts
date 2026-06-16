import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

import sharp from 'sharp';
import {env} from '$env/dynamic/private';

import type {BusinessPayload} from '$lib/cms/business/types';
import type {EventPayload} from '$lib/cms/events/types';
import {needsGermanTranslation, slugify, swissGerman} from '$lib/utils';

const execFileAsync = promisify(execFile);

const MAX_IMAGE_WIDTH = 1280;
const MAX_IMAGE_HEIGHT = 720;
const IMAGE_WEBP_QUALITY = 78;

const MAX_VIDEO_WIDTH = 1280;
const MAX_VIDEO_HEIGHT = 720;
const VIDEO_CRF = env.CMS_VIDEO_CRF || '34';
const VIDEO_CPU_USED = env.CMS_VIDEO_CPU_USED || '5';

type PreparedMediaKind = 'image' | 'video';

export type PreparedUpload = {
    file: File;
    bytes: Uint8Array;
    filename: string;
    originalFilename: string;
    mimeType: 'image/webp' | 'video/webm';
    size: number;
    kind: PreparedMediaKind;
};

type LocalizedRecord = {
    el: string;
    de: string;
};

function baseNameWithoutExt(filename: string) {
    return (
        filename
            .split('/')
            .pop()
            ?.replace(/\.[^.]+$/, '') || crypto.randomUUID()
    );
}

function safeBaseFilename(filename: string) {
    return slugify(baseNameWithoutExt(filename)) || crypto.randomUUID();
}

function isImageFile(file: File) {
    return file.type.startsWith('image/');
}

function isVideoFile(file: File) {
    return file.type.startsWith('video/');
}

async function getFfmpegPath() {
    if (env.FFMPEG_PATH) return env.FFMPEG_PATH;

    const mod = await import('ffmpeg-static');
    const candidate = mod.default || mod;

    if (!candidate || typeof candidate !== 'string') {
        throw new Error('FFmpeg binary not found. Install ffmpeg-static or set FFMPEG_PATH.');
    }

    return candidate;
}

async function processImageBytesToWebp(input: Uint8Array) {
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

async function processVideoBytesToWebm(input: Uint8Array, originalFilename: string) {
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
                '-movflags',
                '+faststart',
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

export async function prepareUploadedImageFile(file: File): Promise<PreparedUpload> {
    if (!isImageFile(file)) {
        throw new Error(`Expected an image file, received ${file.type || 'unknown'}`);
    }

    const sourceBytes = new Uint8Array(await file.arrayBuffer());
    const processed = await processImageBytesToWebp(sourceBytes);
    const filename = `${safeBaseFilename(file.name)}.webp`;

    // @ts-ignore
    return {
        file: new File([processed], filename, {type: 'image/webp'}),
        bytes: processed,
        filename,
        originalFilename: file.name,
        mimeType: 'image/webp',
        size: processed.byteLength,
        kind: 'image'
    };
}

export async function prepareUploadedVideoFile(file: File): Promise<PreparedUpload> {
    if (!isVideoFile(file)) {
        throw new Error(`Expected a video file, received ${file.type || 'unknown'}`);
    }

    const sourceBytes = new Uint8Array(await file.arrayBuffer());
    const processed = await processVideoBytesToWebm(sourceBytes, file.name);
    const filename = `${safeBaseFilename(file.name)}.webm`;

    return {
        file: new File([processed], filename, {type: 'video/webm'}),
        bytes: processed,
        filename,
        originalFilename: file.name,
        mimeType: 'video/webm',
        size: processed.byteLength,
        kind: 'video'
    };
}

export async function prepareUploadedMediaFile(file: File): Promise<PreparedUpload> {
    if (isImageFile(file)) return prepareUploadedImageFile(file);
    if (isVideoFile(file)) return prepareUploadedVideoFile(file);

    throw new Error(`Unsupported media type: ${file.type || 'unknown'}. Only images and videos are supported.`);
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 30_000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal
        });
    } finally {
        clearTimeout(timer);
    }
}

export async function translateElToDe(value: string, options: {html?: boolean} = {}) {
    const source = String(value || '');

    if (!source.trim()) return '';

    const shouldTranslate = env.TRANSLATE_MISSING_DE === 'true';
    const deeplApiKey = env.DEEPL_API_KEY;

    if (!shouldTranslate || !deeplApiKey) {
        return swissGerman(source);
    }

    try {
        const body: Record<string, unknown> = {
            text: [source],
            source_lang: 'EL',
            target_lang: 'DE',
            formality: 'prefer_more'
        };

        if (options.html) {
            body.tag_handling = 'html';
            body.tag_handling_version = 'v2';
        }

        const response = await fetchWithTimeout(
            env.DEEPL_API_URL || 'https://api-free.deepl.com/v2/translate',
            {
                method: 'POST',
                headers: {
                    Authorization: `DeepL-Auth-Key ${deeplApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            },
            30_000
        );

        if (!response.ok) {
            return swissGerman(source);
        }

        const data = await response.json();
        const translated = data?.translations?.[0]?.text;

        return swissGerman(translated || source);
    } catch {
        return swissGerman(source);
    }
}

export async function translateLocalizedElToDe(
    localized: Partial<LocalizedRecord> | undefined,
    options: {html?: boolean} = {}
): Promise<LocalizedRecord> {
    const el = String(localized?.el || '');
    const de = String(localized?.de || '');

    if (!needsGermanTranslation(el, de)) {
        return {
            el,
            de: swissGerman(de)
        };
    }

    return {
        el,
        de: await translateElToDe(el, options)
    };
}

export async function translateEventPayloadMissingGerman(event: EventPayload) {
    event.title = await translateLocalizedElToDe(event.title, {html: false});
    event.description = await translateLocalizedElToDe(event.description, {html: false});

    event.sections = await Promise.all(
        event.sections.map(async (section) => ({
            ...section,
            beforeHtml: await translateLocalizedElToDe(section.beforeHtml, {html: true}),
            media: section.media,
            afterHtml: await translateLocalizedElToDe(section.afterHtml, {html: true})
        }))
    );

    return event;
}

export async function translateBusinessPayloadMissingGerman(business: BusinessPayload) {
    business.description = await translateLocalizedElToDe(business.description, {html: false});

    business.sections = await Promise.all(
        business.sections.map(async (section) => ({
            ...section,
            beforeHtml: await translateLocalizedElToDe(section.beforeHtml, {html: true}),
            media: section.media,
            afterHtml: await translateLocalizedElToDe(section.afterHtml, {html: true})
        }))
    );

    return business;
}