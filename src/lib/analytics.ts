import {browser} from '$app/environment';

export type AnalyticsConsent = 'granted' | 'denied';

export type AnalyticsEventParameters = Record<
    string,
    string | number | boolean | null | undefined
>;

declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
    }
}

const CONSENT_STORAGE_KEY = 'gv-hellas.analytics-consent.v1';
const SCRIPT_ID = 'gv-hellas-google-analytics';

let initializedMeasurementId = '';

export function normalizeMeasurementId(value: string | undefined | null) {
    const measurementId = String(value || '').trim().toUpperCase();

    return /^G-[A-Z0-9]+$/.test(measurementId) ? measurementId : '';
}

export function getAnalyticsConsent(): AnalyticsConsent | null {
    if (!browser) return null;

    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);

    return value === 'granted' || value === 'denied' ? value : null;
}

export function setAnalyticsConsent(value: AnalyticsConsent) {
    if (!browser) return;

    window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
}

export function clearAnalyticsConsent() {
    if (!browser) return;

    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
}

export function initGoogleAnalytics(rawMeasurementId: string | undefined | null) {
    if (!browser) return false;

    const measurementId = normalizeMeasurementId(rawMeasurementId);

    if (!measurementId || getAnalyticsConsent() !== 'granted') {
        return false;
    }

    if (initializedMeasurementId === measurementId && window.gtag) {
        const disableKey = `ga-disable-${measurementId}`;
        (window as Window & Record<string, unknown>)[disableKey] = false;

        window.gtag('consent', 'update', {
            analytics_storage: 'granted',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
        });

        return true;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = function (..._args: unknown[]) {
        window.dataLayer?.push(arguments);
    };

    const disableKey = `ga-disable-${measurementId}`;
    (window as Window & Record<string, unknown>)[disableKey] = false;

    window.gtag('consent', 'default', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
        send_page_view: false
    });

    if (!document.getElementById(SCRIPT_ID)) {
        const script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
        document.head.appendChild(script);
    }

    initializedMeasurementId = measurementId;
    return true;
}


function expireAnalyticsCookies() {
    const cookieNames = document.cookie
        .split(';')
        .map((entry) => entry.split('=')[0]?.trim())
        .filter((name) => name === '_ga' || name?.startsWith('_ga_'));

    const hostnameParts = window.location.hostname.split('.');
    const domains = new Set<string>(['', window.location.hostname]);

    for (let index = 0; index < hostnameParts.length - 1; index += 1) {
        domains.add(`.${hostnameParts.slice(index).join('.')}`);
    }

    for (const name of cookieNames) {
        if (!name) continue;

        for (const domain of domains) {
            document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax${
                domain ? `; domain=${domain}` : ''
            }`;
        }
    }
}

export function disableGoogleAnalytics(rawMeasurementId: string | undefined | null) {
    if (!browser) return;

    const measurementId = normalizeMeasurementId(rawMeasurementId);

    if (!measurementId) return;

    const disableKey = `ga-disable-${measurementId}`;
    (window as Window & Record<string, unknown>)[disableKey] = true;

    window.gtag?.('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
    });

    expireAnalyticsCookies();
}

export function trackPageView(input: {
    measurementId: string | undefined | null;
    location: string;
    title: string;
    referrer?: string;
}) {
    const measurementId = normalizeMeasurementId(input.measurementId);

    if (!measurementId || !initGoogleAnalytics(measurementId) || !window.gtag) {
        return;
    }

    const url = new URL(input.location);

    window.gtag('event', 'page_view', {
        send_to: measurementId,
        page_location: url.href,
        page_path: `${url.pathname}${url.search}${url.hash}`,
        page_title: input.title,
        ...(input.referrer ? {page_referrer: input.referrer} : {})
    });
}

export function trackAnalyticsEvent(
    rawMeasurementId: string | undefined | null,
    eventName: string,
    parameters: AnalyticsEventParameters = {}
) {
    const measurementId = normalizeMeasurementId(rawMeasurementId);
    const normalizedEventName = eventName.trim();

    if (
        !measurementId ||
        !normalizedEventName ||
        !initGoogleAnalytics(measurementId) ||
        !window.gtag
    ) {
        return;
    }

    window.gtag('event', normalizedEventName, {
        send_to: measurementId,
        ...parameters
    });
}
