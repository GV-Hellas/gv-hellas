import fs from 'node:fs';
import path from 'node:path';

const inputPath = path.resolve(process.argv[2] || 'data/cms.json');
const outputPath = path.resolve(process.argv[3] || 'data/cms.events.v2.json');

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?.*)?$/i;
const AUDIO_EXT = /\.(mp3|wav|m4a|ogg|aac)(\?.*)?$/i;

function emptyLocalized() {
    return { el: '', de: '' };
}

function cleanUrl(url) {
    return String(url || '').replace(/\?_=\d+$/, '').trim();
}

function stripHtml(html) {
    return String(html || '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function sanitizeSmallHtml(html) {
    return String(html || '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<(?!\/?(p|br|strong|b|em|i|u|a)(\s|>|\/))/gi, '&lt;')
        .replace(/\s(?:style|class|id|width|height|data-[^=]+|loading|decoding)="[^"]*"/gi, '')
        .replace(/\s(?:style|class|id|width|height|data-[^=]+|loading|decoding)='[^']*'/gi, '')
        .replace(/<a\s+([^>]*?)>/gi, (m, attrs) => {
            const href = attrs.match(/href=["']([^"']+)["']/i)?.[1] || '';
            if (!/^(https?:|mailto:|tel:)/i.test(href)) return '<a>';
            return `<a href="${href}" target="_blank" rel="noopener noreferrer">`;
        })
        .trim();
}

function removeMediaHtml(html) {
    return String(html || '')
        .replace(/<video[\s\S]*?<\/video>/gi, '')
        .replace(/<audio[\s\S]*?<\/audio>/gi, '')
        .replace(/<img[^>]*>/gi, '')
        .replace(/<source[^>]*>/gi, '');
}

function inferType(url) {
    if (VIDEO_EXT.test(url)) return 'video';
    if (AUDIO_EXT.test(url)) return 'audio';
    return 'image';
}

function collectMedia(event) {
    const media = [];
    const seen = new Set();

    function add(url, alt = '') {
        url = cleanUrl(url);
        if (!url || seen.has(url)) return;
        if (!IMAGE_EXT.test(url) && !VIDEO_EXT.test(url) && !AUDIO_EXT.test(url)) return;

        seen.add(url);
        media.push({
            id: crypto.randomUUID(),
            type: inferType(url),
            url,
            filename: decodeURIComponent(url.split('/').pop()?.split('?')[0] || ''),
            mimeType: '',
            alt: { el: alt || '', de: alt || '' }
        });
    }

    if (event.image) add(event.image, event.title?.el || event.title?.de || '');

    for (const lang of ['el', 'de']) {
        const html = event.content?.[lang] || '';

        for (const match of html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)) {
            add(match[1], event.title?.[lang] || '');
        }

        for (const match of html.matchAll(/<(?:video|audio|source)[^>]+src=["']([^"']+)["'][^>]*>/gi)) {
            add(match[1], event.title?.[lang] || '');
        }

        for (const match of html.matchAll(/https?:\/\/[^\s"'<>]+\.(?:mp4|webm|mov|m4v|mp3|wav|m4a|ogg|aac|png|jpe?g|webp|gif)(?:\?[^\s"'<>]+)?/gi)) {
            add(match[0], event.title?.[lang] || '');
        }
    }

    return media;
}

function inferCategory(event) {
    const haystack = `${event.slug || ''} ${event.title?.el || ''} ${event.title?.de || ''}`.toLowerCase();

    if (/αποκρ|party|πάρτυ|fasnacht/.test(haystack)) return 'party';
    if (/γενικ|assembly|versammlung|πίτα|pita/.test(haystack)) return 'assembly';
    if (/πασχ|ostern|εκκλη|kirche|kathara|δευτερα/.test(haystack)) return 'religion';
    if (/χορευ|dance|tanz/.test(haystack)) return 'dance';

    return 'general';
}

function toDateParts(rawDate) {
    const d = rawDate ? new Date(rawDate) : new Date();

    if (Number.isNaN(d.getTime())) {
        return { date: '', time: '' };
    }

    return {
        date: d.toISOString().slice(0, 10),
        time: d.toISOString().slice(11, 16)
    };
}

function migrateEvent(event) {
    const { date, time } = toDateParts(event.date);

    const beforeHtml = {
        el: sanitizeSmallHtml(removeMediaHtml(event.content?.el || '')),
        de: sanitizeSmallHtml(removeMediaHtml(event.content?.de || ''))
    };

    const description = {
        el: stripHtml(event.excerpt?.el || '').slice(0, 360),
        de: stripHtml(event.excerpt?.de || '').slice(0, 360)
    };

    const media = collectMedia(event);

    return {
        id: event.id || crypto.randomUUID(),
        slug: event.slug,
        title: {
            el: event.title?.el || '',
            de: event.title?.de || event.title?.el || ''
        },
        description,
        date,
        time,
        location: '',
        category: inferCategory(event),
        priceMembers: null,
        pricePublic: null,
        sections: [
            {
                id: crypto.randomUUID(),
                beforeHtml,
                media,
                afterHtml: emptyLocalized()
            }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

const cms = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

const migrated = {
    ...cms,
    events: (cms.events || []).map(migrateEvent)
};

fs.writeFileSync(outputPath, JSON.stringify(migrated, null, 2), 'utf-8');

console.log(`Migrated ${migrated.events.length} events`);
console.log(`Written to ${outputPath}`);