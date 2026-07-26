import {env} from '$env/dynamic/public';
import type {Handle} from '@sveltejs/kit';

import {
    ANALYTICS_CONSENT_STORAGE_KEY,
    GOOGLE_ANALYTICS_SCRIPT_ID,
    normalizeMeasurementId
} from '$lib/analyticsConfig';

const GOOGLE_ANALYTICS_HEAD_MARKER = '<!-- gv-hellas:google-analytics -->';

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

export const handle: Handle = async ({event, resolve}) => {
    const measurementId = normalizeMeasurementId(env.PUBLIC_GOOGLE_ANALYTICS_ID);
    const shouldInjectGoogleAnalytics = Boolean(
        measurementId && !event.url.pathname.startsWith('/admin')
    );

    return resolve(event, {
        transformPageChunk: ({html}) =>
            html.replace(
                GOOGLE_ANALYTICS_HEAD_MARKER,
                shouldInjectGoogleAnalytics ? googleAnalyticsHead(measurementId) : ''
            )
    });
};
