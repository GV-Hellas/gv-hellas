import {dev} from '$app/environment';
import {env} from '$env/dynamic/public';
import type {Handle, RequestEvent} from '@sveltejs/kit';

import {
    ANALYTICS_CONSENT_STORAGE_KEY,
    GOOGLE_ANALYTICS_SCRIPT_ID,
    normalizeMeasurementId
} from '$lib/analyticsConfig';

const GOOGLE_ANALYTICS_HEAD_MARKER =
    '<meta name="gv-hellas-google-analytics-placeholder" content=""/>';
const BROWSER_CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=300';
const VERCEL_CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=86400';

function googleAnalyticsHead(measurementId: string) {
    const encodedMeasurementId = encodeURIComponent(measurementId);
    const serializedMeasurementId = JSON.stringify(measurementId);
    const serializedStorageKey = JSON.stringify(ANALYTICS_CONSENT_STORAGE_KEY);

    return `<script>
(function () {
    var measurementId = ${serializedMeasurementId};
    var consentStorageKey = ${serializedStorageKey};

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
        window.dataLayer.push(arguments);
    };

    window.gtag('consent', 'default', {
        ad_storage: 'denied',
        analytics_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
    });

    var storedConsent = null;

    try {
        storedConsent = window.localStorage.getItem(consentStorageKey);
    } catch (_) {
        storedConsent = null;
    }

    if (storedConsent === 'granted' || storedConsent === 'denied') {
        window.gtag('consent', 'update', {
            ad_storage: 'denied',
            analytics_storage: storedConsent,
            ad_user_data: 'denied',
            ad_personalization: 'denied'
        });
    }

    window.gtag('set', 'ads_data_redaction', true);
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false
    });

    window.__gvHellasGa4 = {
        measurementId: measurementId,
        consentDefaultSet: true,
        configured: true,
        appliedConsent: storedConsent === 'granted' || storedConsent === 'denied'
            ? storedConsent
            : null
    };
})();
</script>
<script async id="${GOOGLE_ANALYTICS_SCRIPT_ID}" src="https://www.googletagmanager.com/gtag/js?id=${encodedMeasurementId}"></script>`;
}

function isPublicPageRequest(event: RequestEvent, response: Response) {
    if (dev || event.request.method !== 'GET' || response.status !== 200) return false;

    const routeId = event.route.id || '';

    if (!routeId || routeId.startsWith('/admin') || routeId.startsWith('/api')) {
        return false;
    }

    if (response.headers.has('set-cookie')) return false;

    const existingCacheControl = response.headers.get('cache-control') || '';

    if (/\b(?:private|no-store)\b/i.test(existingCacheControl)) {
        return false;
    }

    const contentType = response.headers.get('content-type') || '';

    return (
        contentType.includes('text/html') ||
        contentType.includes('application/json') ||
        contentType.includes('application/octet-stream')
    );
}


function applyPrivateAdminHeaders(event: RequestEvent, response: Response) {
    if (!event.url.pathname.startsWith('/admin')) return;

    response.headers.set('cache-control', 'private, no-store');
    response.headers.set('x-robots-tag', 'noindex, nofollow, noarchive');
}

function applyPublicCaching(event: RequestEvent, response: Response) {
    if (!isPublicPageRequest(event, response)) return;

    // Browser caching makes quick back/forward visits instant. The Vercel-only
    // header keeps SSR HTML and SvelteKit __data.json responses close to users
    // while refreshing CMS content in the background.
    response.headers.set('cache-control', BROWSER_CACHE_CONTROL);
    response.headers.set('vercel-cdn-cache-control', VERCEL_CACHE_CONTROL);
}

export const handle: Handle = async ({event, resolve}) => {
    const measurementId = normalizeMeasurementId(env.PUBLIC_GOOGLE_ANALYTICS_ID);
    const shouldInjectGoogleAnalytics = Boolean(
        measurementId && !event.url.pathname.startsWith('/admin')
    );

    const response = await resolve(event, {
        transformPageChunk: ({html}) =>
            html.replace(
                GOOGLE_ANALYTICS_HEAD_MARKER,
                shouldInjectGoogleAnalytics ? googleAnalyticsHead(measurementId) : ''
            )
    });

    applyPrivateAdminHeaders(event, response);
    applyPublicCaching(event, response);

    return response;
};
