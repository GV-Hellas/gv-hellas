import type {RequestHandler} from './$types';

import {listBusinesses} from '$lib/server/cms/businessStore';
import {listEvents} from '$lib/server/cms/eventsStore';

const SITE_URL = 'https://gv-hellas.ch';

const STATIC_ROUTES = [
    '/',
    '/events',
    '/gallery',
    '/businesses',
    '/links',
    '/church',
    '/equipment',
    '/contact'
];

function xmlEscape(value: string) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;');
}

function absoluteUrl(pathname: string) {
    return new URL(pathname, SITE_URL).toString();
}

function urlEntry(pathname: string, lastModified?: string) {
    const lastmod = lastModified
        ? `<lastmod>${xmlEscape(lastModified.slice(0, 10))}</lastmod>`
        : '';

    return `<url><loc>${xmlEscape(absoluteUrl(pathname))}</loc>${lastmod}</url>`;
}

export const GET: RequestHandler = async () => {
    const [eventsResult, businessesResult] = await Promise.allSettled([
        listEvents(),
        listBusinesses()
    ]);

    const events = eventsResult.status === 'fulfilled' ? eventsResult.value : [];
    const businesses = businessesResult.status === 'fulfilled' ? businessesResult.value : [];

    const entries = [
        ...STATIC_ROUTES.map((pathname) => urlEntry(pathname)),
        ...events.map((event) =>
            urlEntry(`/events/${encodeURIComponent(event.slug)}`, event.updatedAt)
        ),
        ...businesses.map((business) =>
            urlEntry(`/businesses/${encodeURIComponent(business.slug)}`, business.updatedAt)
        )
    ];

    return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join('')}</urlset>`,
        {
            headers: {
                'content-type': 'application/xml; charset=utf-8',
                'cache-control': 'public, max-age=300, stale-while-revalidate=3600',
                'vercel-cdn-cache-control': 'public, max-age=3600, stale-while-revalidate=86400'
            }
        }
    );
};
