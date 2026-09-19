#!/usr/bin/env node

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';

import dotenv from 'dotenv';
import exifr from 'exifr';
import {createClient} from '@supabase/supabase-js';

dotenv.config({path: '.env'});
dotenv.config({path: '.env.local', override: true});

const ROOT = process.cwd();

const argv = process.argv.slice(2);
const flags = new Set(argv);

const WRITE = flags.has('--write');
const OVERWRITE = flags.has('--overwrite');
const USE_MTIME = flags.has('--mtime-fallback');

function argumentValue(name, fallback = '') {
    const prefix = `${name}=`;
    const hit = argv.find((arg) => arg.startsWith(prefix));

    return hit ? hit.slice(prefix.length) : fallback;
}

function firstExisting(paths) {
    return paths.find((candidate) => fsSync.existsSync(candidate)) || null;
}

const explicitJsonPath = argumentValue('--json');

const CMS_JSON_PATH = explicitJsonPath
    ? path.resolve(ROOT, explicitJsonPath)
    : firstExisting([
        path.resolve(ROOT, 'data/cms.json'),
        path.resolve(ROOT, 'cms.json'),
        path.resolve(ROOT, 'static/cms.json')
    ]);

const STATIC_ROOT = path.resolve(
    ROOT,
    argumentValue(
        '--static-root',
        process.env.GALLERY_ORIGINALS_ROOT || 'static'
    )
);

const REPORT_PATH = path.resolve(
    ROOT,
    argumentValue(
        '--report',
        'gallery-year-seed-report.json'
    )
);

const SUPABASE_URL =
    process.env.PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;

const SUPABASE_SECRET_KEY =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE;

function required(value, name) {
    if (!value) {
        throw new Error(`${name} is not set`);
    }

    return value;
}

required(
    SUPABASE_URL,
    'PUBLIC_SUPABASE_URL (or SUPABASE_URL)'
);

required(
    SUPABASE_SECRET_KEY,
    'SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY)'
);

if (!CMS_JSON_PATH) {
    throw new Error(
        [
            'cms.json was not found.',
            '',
            'Tried:',
            `  ${path.resolve(ROOT, 'data/cms.json')}`,
            `  ${path.resolve(ROOT, 'cms.json')}`,
            `  ${path.resolve(ROOT, 'static/cms.json')}`,
            '',
            'Or specify it manually:',
            '  node scripts/seed-gallery-years-from-originals.mjs --json=/path/to/cms.json'
        ].join('\n')
    );
}

if (!fsSync.existsSync(STATIC_ROOT)) {
    throw new Error(
        `Static/original image root not found: ${STATIC_ROOT}`
    );
}

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    }
);

const IMAGE_EXTENSIONS = new Set([
    '.jpg',
    '.jpeg',
    '.heic',
    '.heif',
    '.tif',
    '.tiff',
    '.png',
    '.avif',
    '.webp'
]);

function log(message) {
    console.log(`[gallery year seed] ${message}`);
}

function warn(message) {
    console.warn(`[gallery year seed warning] ${message}`);
}

function normalizeSlashes(value) {
    return String(value || '').replaceAll('\\', '/');
}

function decodeRepeated(value) {
    let current = String(value || '').trim();

    for (let i = 0; i < 5; i += 1) {
        try {
            const decoded = decodeURIComponent(current);

            if (decoded === current) {
                return decoded;
            }

            current = decoded;
        } catch {
            return current;
        }
    }

    return current;
}

function stripQuery(value) {
    return String(value || '')
        .split('?')[0]
        .split('#')[0];
}

function stripVariantSuffix(stem) {
    let value = String(stem || '');

    // Remove generated/original markers repeatedly because filenames may
    // contain combinations such as "...-orig-480".
    let previous;

    do {
        previous = value;

        value = value
            .replace(/[-_](480|960|1440|1920|2048)(w)?$/i, '')
            .replace(/[-_](480|960|1440|1920|2048)x\d+$/i, '')
            .replace(/[-_]\d+x(480|960|1440|1920|2048)$/i, '')
            .replace(/[-_]\d+x\d+$/i, '')
            .replace(/[-_]scaled$/i, '')
            .replace(/[-_]edited$/i, '')
            .replace(/[-_]small$/i, '')
            .replace(/[-_]medium$/i, '')
            .replace(/[-_]large$/i, '')
            .replace(/[-_]orig(?:inal)?$/i, '');
    } while (value !== previous);

    return value;
}

function normalizedStem(filePath) {
    const clean = stripQuery(filePath);
    const ext = path.extname(clean);

    return stripVariantSuffix(
        path.basename(clean, ext)
    ).toLocaleLowerCase();
}

function isImagePath(value) {
    const ext = path
        .extname(stripQuery(String(value || '')))
        .toLocaleLowerCase();

    return IMAGE_EXTENSIONS.has(ext);
}

function originalPreference(filePath) {
    const ext = path
        .extname(filePath)
        .toLocaleLowerCase();

    const basename = path
        .basename(filePath)
        .toLocaleLowerCase();

    let score = 0;

    // Explicit original files should strongly win over generated variants.
    if (/[-_]orig(?:inal)?\./i.test(basename)) {
        score += 1000;
    }

    // Generated derivatives should be strongly deprioritized.
    if (/[-_](480|960|1440|1920|2048)(w)?\./i.test(basename)) {
        score -= 500;
    }

    if (/[-_]\d+x\d+\./i.test(basename)) {
        score -= 400;
    }

    // Prefer formats commonly used by original camera/iPhone images.
    if (ext === '.heic' || ext === '.heif') score += 100;
    else if (ext === '.jpg' || ext === '.jpeg') score += 90;
    else if (ext === '.tif' || ext === '.tiff') score += 80;
    else if (ext === '.png') score += 60;
    else if (ext === '.avif') score += 40;
    else if (ext === '.webp') score += 10;

    return score;
}

async function walkImages(dir, output = []) {
    const entries = await fs.readdir(
        dir,
        {withFileTypes: true}
    );

    for (const entry of entries) {
        const filePath = path.join(
            dir,
            entry.name
        );

        if (entry.isDirectory()) {
            await walkImages(filePath, output);
            continue;
        }

        if (!entry.isFile()) {
            continue;
        }

        const ext = path
            .extname(entry.name)
            .toLocaleLowerCase();

        if (IMAGE_EXTENSIONS.has(ext)) {
            output.push(filePath);
        }
    }

    return output;
}

async function buildFileIndex() {
    log(
        `Indexing candidate images under ${STATIC_ROOT} ...`
    );

    const files = await walkImages(STATIC_ROOT);

    const byBasename = new Map();
    const byStem = new Map();

    for (const filePath of files) {
        const basename = path
            .basename(filePath)
            .toLocaleLowerCase();

        const stem = normalizedStem(filePath);

        {
            const list =
                byBasename.get(basename) || [];

            list.push(filePath);
            byBasename.set(
                basename,
                list
            );
        }

        {
            const list =
                byStem.get(stem) || [];

            list.push(filePath);
            byStem.set(
                stem,
                list
            );
        }
    }

    log(
        `Indexed ${files.length} candidate image file(s).`
    );

    return {
        files,
        byBasename,
        byStem
    };
}

async function pickBestFile(candidates) {
    const unique = [
        ...new Set(
            candidates.filter(Boolean)
        )
    ];

    const scored = [];

    for (const filePath of unique) {
        if (!fsSync.existsSync(filePath)) {
            continue;
        }

        try {
            const stat = await fs.stat(
                filePath
            );

            if (!stat.isFile()) {
                continue;
            }

            scored.push({
                filePath,
                preference:
                    originalPreference(filePath),
                size: stat.size
            });
        } catch {
            // Ignore inaccessible candidates.
        }
    }

    scored.sort((a, b) => {
        if (
            b.preference !==
            a.preference
        ) {
            return (
                b.preference -
                a.preference
            );
        }

        // Between files of the same type,
        // the larger one is normally the
        // higher-quality/original file.
        return b.size - a.size;
    });

    return scored[0]?.filePath || null;
}

function urlPathname(value) {
    let result = String(
        value || ''
    ).trim();

    if (!result) {
        return '';
    }

    try {
        if (/^https?:\/\//i.test(result)) {
            result =
                new URL(result).pathname;
        }
    } catch {
        // Keep raw value.
    }

    return decodeRepeated(
        stripQuery(result)
    );
}

function candidateLocalPaths(src) {
    const pathname =
        urlPathname(src);

    if (!pathname) {
        return [];
    }

    const relative =
        normalizeSlashes(pathname)
            .replace(/^\/+/, '');

    const basename =
        path.basename(relative);

    const candidates =
        new Set();

    candidates.add(
        path.resolve(
            STATIC_ROOT,
            relative
        )
    );

    candidates.add(
        path.resolve(
            STATIC_ROOT,
            basename
        )
    );

    candidates.add(
        path.resolve(
            STATIC_ROOT,
            'uploads',
            basename
        )
    );

    // Common Svelte/public conventions.
    candidates.add(
        path.resolve(
            STATIC_ROOT,
            'images',
            basename
        )
    );

    candidates.add(
        path.resolve(
            STATIC_ROOT,
            'gallery',
            basename
        )
    );

    return [...candidates];
}

async function findOriginalFile(
    sources,
    fileIndex
) {
    const candidates = new Set();

    for (const source of sources) {
        const pathname = urlPathname(source);

        if (!pathname) {
            continue;
        }

        /*
         * Add direct-path candidates, but DO NOT immediately return them.
         *
         * A direct hit is often the generated -480.jpg file, while an
         * -orig.heic file with the same canonical stem may also exist.
         */
        for (const candidate of candidateLocalPaths(source)) {
            candidates.add(candidate);
        }

        const basename = path
            .basename(pathname)
            .toLocaleLowerCase();

        for (
            const candidate
            of fileIndex.byBasename.get(basename) || []
            ) {
            candidates.add(candidate);
        }

        /*
         * normalizedStem() now maps all of these to the same key:
         *
         * img-abcdef-480.jpg
         * img-abcdef-960.webp
         * img-abcdef-orig.heic
         * img-abcdef-orig.jpg
         */
        const stem = normalizedStem(pathname);

        if (stem) {
            for (
                const candidate
                of fileIndex.byStem.get(stem) || []
                ) {
                candidates.add(candidate);
            }
        }
    }

    /*
     * Only now choose the best candidate.
     *
     * This allows -orig.heic / -orig.jpg to beat the generated
     * -480.jpg / -960.webp files.
     */
    return pickBestFile([...candidates]);
}

function collectMediaStrings(
    value,
    output = [],
    depth = 0
) {
    if (depth > 5) {
        return output;
    }

    if (typeof value === 'string') {
        const trimmed =
            value.trim();

        if (
            trimmed &&
            (
                isImagePath(trimmed) ||
                /\/uploads\//i.test(trimmed) ||
                /\/gallery\//i.test(trimmed)
            )
        ) {
            output.push(trimmed);
        }

        return output;
    }

    if (
        !value ||
        typeof value !== 'object'
    ) {
        return output;
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            collectMediaStrings(
                item,
                output,
                depth + 1
            );
        }

        return output;
    }

    // Prioritize fields that are likely to
    // contain the original/source image.
    const preferredKeys = [
        'original',
        'originalSrc',
        'original_src',
        'source',
        'sourceSrc',
        'source_src',
        'src',
        'image',
        'imageSrc',
        'image_src',
        'url',
        'path',
        'file',
        'filename'
    ];

    for (const key of preferredKeys) {
        if (key in value) {
            collectMediaStrings(
                value[key],
                output,
                depth + 1
            );
        }
    }

    // Afterwards inspect image variant fields.
    const variantKeys = [
        'src480',
        'src_480',
        'src960',
        'src_960',
        'srcWebp',
        'src_webp',
        'srcJpg',
        'src_jpg',
        'srcVariants',
        'variants',
        'media'
    ];

    for (const key of variantKeys) {
        if (key in value) {
            collectMediaStrings(
                value[key],
                output,
                depth + 1
            );
        }
    }

    return output;
}

function looksLikeGalleryItem(value) {
    if (
        !value ||
        typeof value !== 'object' ||
        Array.isArray(value)
    ) {
        return false;
    }

    if (
        typeof value.id !== 'string' &&
        typeof value.id !== 'number'
    ) {
        return false;
    }

    const keys =
        Object.keys(value);

    return keys.some((key) =>
        [
            'src',
            'src480',
            'src_480',
            'src960',
            'src_960',
            'videoSrc',
            'video_src',
            'srcVariants',
            'media',
            'alt',
            'tags'
        ].includes(key)
    );
}

function findGalleryArrays(
    value,
    currentPath = '$',
    results = [],
    depth = 0
) {
    if (depth > 8) {
        return results;
    }

    if (Array.isArray(value)) {
        if (value.length > 0) {
            const matching =
                value.filter(
                    looksLikeGalleryItem
                );

            if (
                matching.length >=
                Math.max(
                    1,
                    Math.floor(
                        value.length * 0.5
                    )
                )
            ) {
                results.push({
                    path: currentPath,
                    items: value,
                    score: matching.length
                });
            }
        }

        for (
            let i = 0;
            i < value.length;
            i += 1
        ) {
            findGalleryArrays(
                value[i],
                `${currentPath}[${i}]`,
                results,
                depth + 1
            );
        }

        return results;
    }

    if (
        !value ||
        typeof value !== 'object'
    ) {
        return results;
    }

    for (const [key, child] of Object.entries(value)) {
        findGalleryArrays(
            child,
            `${currentPath}.${key}`,
            results,
            depth + 1
        );
    }

    return results;
}

function selectGalleryArray(cms) {
    // First try the common structures directly.
    const directCandidates = [
        ['$.gallery', cms?.gallery],
        [
            '$.galleryItems',
            cms?.galleryItems
        ],
        [
            '$.gallery_items',
            cms?.gallery_items
        ],
        [
            '$.content.gallery',
            cms?.content?.gallery
        ],
        [
            '$.data.gallery',
            cms?.data?.gallery
        ]
    ];

    for (
        const [jsonPath, value]
        of directCandidates
        ) {
        if (
            Array.isArray(value) &&
            value.some(
                looksLikeGalleryItem
            )
        ) {
            return {
                path: jsonPath,
                items: value
            };
        }
    }

    const discovered =
        findGalleryArrays(cms)
            .sort(
                (a, b) =>
                    b.score -
                    a.score
            );

    if (!discovered.length) {
        throw new Error(
            [
                'Could not automatically locate gallery items inside cms.json.',
                '',
                'The script looks for an array of objects containing fields such as:',
                'id, src, src480, src960, alt, tags, etc.',
                '',
                `JSON file: ${CMS_JSON_PATH}`
            ].join('\n')
        );
    }

    if (discovered.length > 1) {
        warn(
            `Found ${discovered.length} gallery-like arrays. Using ${discovered[0].path}.`
        );

        for (
            const candidate
            of discovered.slice(0, 5)
            ) {
            warn(
                `  candidate ${candidate.path}: ${candidate.items.length} entries`
            );
        }
    }

    return discovered[0];
}

async function readCmsGalleryItems() {
    const raw =
        await fs.readFile(
            CMS_JSON_PATH,
            'utf8'
        );

    const cms =
        JSON.parse(raw);

    const selected =
        selectGalleryArray(cms);

    log(
        `Gallery data found at ${selected.path} (${selected.items.length} row(s)).`
    );

    return selected.items;
}

function yearFromValue(value) {
    if (!value) {
        return null;
    }

    if (
        value instanceof Date &&
        !Number.isNaN(
            value.getTime()
        )
    ) {
        const year =
            value.getFullYear();

        return (
            year >= 1900 &&
            year <= 2200
        )
            ? year
            : null;
    }

    const text =
        String(value).trim();

    const match =
        text.match(
            /\b((?:19|20|21)\d{2})\b/
        );

    if (!match) {
        return null;
    }

    const year =
        Number(match[1]);

    return (
        year >= 1900 &&
        year <= 2200
    )
        ? year
        : null;
}

async function readPhotoYear(filePath) {
    try {
        const metadata =
            await exifr.parse(
                filePath,
                {
                    pick: [
                        'DateTimeOriginal',
                        'CreateDate',
                        'DateTimeDigitized',
                        'ModifyDate'
                    ],
                    translateKeys: true,
                    translateValues: false,
                    reviveValues: true,
                    silentErrors: true
                }
            );

        const candidates = [
            [
                'DateTimeOriginal',
                metadata?.DateTimeOriginal
            ],
            [
                'CreateDate',
                metadata?.CreateDate
            ],
            [
                'DateTimeDigitized',
                metadata?.DateTimeDigitized
            ]
        ];

        for (
            const [tag, value]
            of candidates
            ) {
            const year =
                yearFromValue(value);

            if (year) {
                return {
                    year,
                    source: tag
                };
            }
        }
    } catch (error) {
        warn(
            `EXIF read failed for ${filePath}: ${
                error instanceof Error
                    ? error.message
                    : String(error)
            }`
        );
    }

    if (USE_MTIME) {
        try {
            const stat =
                await fs.stat(
                    filePath
                );

            const year =
                stat.mtime.getFullYear();

            if (
                year >= 1900 &&
                year <= 2200
            ) {
                return {
                    year,
                    source:
                        'filesystem-mtime'
                };
            }
        } catch {
            // Ignore fallback error.
        }
    }

    return null;
}

async function loadSupabaseGalleryItems() {
    const {data, error} =
        await supabase
            .from('gallery_items')
            .select(
                'id, type, year'
            );

    if (error) {
        throw new Error(
            `Loading Supabase gallery_items failed: ${error.message}`
        );
    }

    return new Map(
        (data || []).map(
            (item) => [
                String(item.id),
                item
            ]
        )
    );
}

function galleryItemId(item) {
    const value =
        item?.id ??
        item?.slug ??
        item?.key;

    return String(value || '').trim();
}

function galleryItemIsVideo(item) {
    const type =
        String(
            item?.type ||
            ''
        ).toLocaleLowerCase();

    if (
        type === 'video' ||
        type === 'audio'
    ) {
        return true;
    }

    const sources =
        collectMediaStrings(item);

    return (
        sources.length > 0 &&
        sources.every(
            (src) =>
                /\.(webm|mp4|mov|m4v)$/i.test(
                    stripQuery(src)
                )
        )
    );
}

function uniqueSources(item) {
    return [
        ...new Set(
            collectMediaStrings(item)
                .map((value) =>
                    String(value).trim()
                )
                .filter(Boolean)
        )
    ];
}

async function main() {
    log(
        `Mode: ${
            WRITE
                ? 'WRITE'
                : 'DRY RUN'
        }`
    );

    log(
        `Overwrite existing years: ${
            OVERWRITE
                ? 'yes'
                : 'no'
        }`
    );

    log(
        `CMS JSON: ${CMS_JSON_PATH}`
    );

    log(
        `Originals root: ${STATIC_ROOT}`
    );

    log(
        `Supabase: ${SUPABASE_URL}`
    );

    if (!WRITE) {
        log(
            'No database changes will be made.'
        );
    }

    const [
        cmsItems,
        fileIndex,
        supabaseItems
    ] = await Promise.all([
        readCmsGalleryItems(),
        buildFileIndex(),
        loadSupabaseGalleryItems()
    ]);

    const report = {
        generatedAt:
            new Date().toISOString(),

        writeMode: WRITE,
        overwrite: OVERWRITE,

        cmsJson:
        CMS_JSON_PATH,

        originalsRoot:
        STATIC_ROOT,

        totals: {
            cmsRows:
            cmsItems.length,

            updated: 0,
            wouldUpdate: 0,

            skippedExistingYear: 0,

            invalidCmsRow: 0,
            notInSupabase: 0,
            notImage: 0,

            noSourceInCms: 0,
            originalNotFound: 0,
            metadataYearNotFound: 0,

            updateFailed: 0
        },

        items: []
    };

    for (
        const cmsItem
        of cmsItems
        ) {
        const id =
            galleryItemId(
                cmsItem
            );

        if (!id) {
            report.totals
                .invalidCmsRow += 1;

            report.items.push({
                status:
                    'invalid-cms-row'
            });

            continue;
        }

        const current =
            supabaseItems.get(id);

        if (!current) {
            report.totals
                .notInSupabase += 1;

            report.items.push({
                id,
                status:
                    'not-in-supabase'
            });

            continue;
        }

        if (
            current.type === 'video' ||
            galleryItemIsVideo(cmsItem)
        ) {
            report.totals
                .notImage += 1;

            continue;
        }

        if (
            !OVERWRITE &&
            Number.isInteger(
                current.year
            )
        ) {
            report.totals
                .skippedExistingYear +=
                1;

            report.items.push({
                id,
                status:
                    'already-has-year',
                year:
                current.year
            });

            continue;
        }

        const sources =
            uniqueSources(cmsItem);

        if (!sources.length) {
            report.totals
                .noSourceInCms += 1;

            report.items.push({
                id,
                status:
                    'no-source-in-cms'
            });

            warn(
                `${id}: no image source found in cms.json`
            );

            continue;
        }

        const originalFile =
            await findOriginalFile(
                sources,
                fileIndex
            );

        if (!originalFile) {
            report.totals
                .originalNotFound +=
                1;

            report.items.push({
                id,
                status:
                    'original-not-found',
                sources
            });

            warn(
                `${id}: original image not found`
            );

            continue;
        }

        const detected =
            await readPhotoYear(
                originalFile
            );

        const relativeFile =
            path.relative(
                ROOT,
                originalFile
            );

        if (!detected) {
            report.totals
                .metadataYearNotFound +=
                1;

            report.items.push({
                id,
                status:
                    'year-not-found',
                file:
                relativeFile,
                sources
            });

            warn(
                `${id}: no capture year found in ${relativeFile}`
            );

            continue;
        }

        if (!WRITE) {
            report.totals
                .wouldUpdate += 1;

            report.items.push({
                id,
                status:
                    'would-update',
                year:
                detected.year,
                metadataSource:
                detected.source,
                file:
                relativeFile,
                previousYear:
                    current.year ??
                    null
            });

            log(
                `${id}: ${detected.year} (${detected.source}) ← ${relativeFile}`
            );

            continue;
        }

        const {error} =
            await supabase
                .from(
                    'gallery_items'
                )
                .update({
                    year:
                    detected.year,
                    updated_at:
                        new Date()
                            .toISOString()
                })
                .eq(
                    'id',
                    id
                );

        if (error) {
            report.totals
                .updateFailed += 1;

            report.items.push({
                id,
                status:
                    'update-failed',
                year:
                detected.year,
                file:
                relativeFile,
                error:
                error.message
            });

            warn(
                `${id}: Supabase update failed: ${error.message}`
            );

            continue;
        }

        report.totals.updated +=
            1;

        report.items.push({
            id,
            status:
                'updated',
            year:
            detected.year,
            metadataSource:
            detected.source,
            file:
            relativeFile,
            previousYear:
                current.year ??
                null
        });

        log(
            `${id}: set year=${detected.year} (${detected.source})`
        );
    }

    await fs.writeFile(
        REPORT_PATH,
        JSON.stringify(
            report,
            null,
            2
        ) + '\n',
        'utf8'
    );

    console.log('\nSummary');
    console.table(
        report.totals
    );

    log(
        `Report written to ${REPORT_PATH}`
    );

    if (
        !WRITE &&
        report.totals
            .wouldUpdate > 0
    ) {
        console.log(
            '\nDry run complete. Review the report, then rerun with --write.'
        );
    }
}

await main();