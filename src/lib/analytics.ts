import {browser} from '$app/environment';

import {
    ANALYTICS_CONSENT_STORAGE_KEY,
    GOOGLE_ANALYTICS_SCRIPT_ID,
    normalizeMeasurementId
} from '$lib/analyticsConfig';

export type AnalyticsConsent = 'granted' | 'denied';

export type AnalyticsEventParameters = Record<
    string,
    string | number | boolean | null | undefined
>;

type GoogleAnalyticsState = {
    measurementId: string;
    consentDefaultSet: boolean;
    configured: boolean;
    appliedConsent: AnalyticsConsent | null;
};

declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
        __gvHellasGa4?: GoogleAnalyticsState;
    }
}

function consentParameters(value: AnalyticsConsent) {
    return {
        ad_storage: 'denied',
        analytics_storage: value,
        ad_user_data: 'denied',
        ad_personalization: 'denied'
    } as const;
}

function getGoogleAnalyticsState(measurementId: string) {
    const existing = window.__gvHellasGa4;

    if (existing?.measurementId === measurementId) {
        return existing;
    }

    const state: GoogleAnalyticsState = {
        measurementId,
        consentDefaultSet: false,
        configured: false,
        appliedConsent: null
    };

    window.__gvHellasGa4 = state;
    return state;
}

function ensureGtag() {
    window.dataLayer = window.dataLayer || [];

    if (!window.gtag) {
        window.gtag = function () {
            window.dataLayer?.push(arguments);
        };
    }
}

function setDefaultConsent(state: GoogleAnalyticsState) {
    if (state.consentDefaultSet || !window.gtag) return;

    window.gtag('consent', 'default', {
        ad_storage: 'denied',
        analytics_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
    });

    state.consentDefaultSet = true;
}

function applyConsent(state: GoogleAnalyticsState, value: AnalyticsConsent) {
    if (!window.gtag || state.appliedConsent === value) return;

    window.gtag('consent', 'update', consentParameters(value));
    state.appliedConsent = value;
}

function configureGoogleAnalytics(state: GoogleAnalyticsState) {
    if (state.configured || !window.gtag) return;

    window.gtag('set', 'ads_data_redaction', true);
    window.gtag('js', new Date());
    window.gtag('config', state.measurementId, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false
    });

    state.configured = true;
}

function ensureGoogleAnalyticsScript(measurementId: string) {
    const existing = document.getElementById(GOOGLE_ANALYTICS_SCRIPT_ID) as HTMLScriptElement | null;
    const expectedSource = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;

    if (existing?.src === expectedSource) return;

    existing?.remove();

    const script = document.createElement('script');
    script.id = GOOGLE_ANALYTICS_SCRIPT_ID;
    script.async = true;
    script.src = expectedSource;
    document.head.appendChild(script);
}

export {normalizeMeasurementId};

export function getAnalyticsConsent(): AnalyticsConsent | null {
    if (!browser) return null;

    try {
        const value = window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);

        return value === 'granted' || value === 'denied' ? value : null;
    } catch {
        return null;
    }
}

export function setAnalyticsConsent(value: AnalyticsConsent) {
    if (!browser) return;

    try {
        window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, value);
    } catch {
        // Some privacy modes disable localStorage. Consent still applies for this page.
    }
}

export function clearAnalyticsConsent() {
    if (!browser) return;

    try {
        window.localStorage.removeItem(ANALYTICS_CONSENT_STORAGE_KEY);
    } catch {
        // Nothing else to clear when localStorage is unavailable.
    }
}

export function initGoogleAnalytics(rawMeasurementId: string | undefined | null) {
    if (!browser) return false;

    const measurementId = normalizeMeasurementId(rawMeasurementId);

    if (!measurementId) return false;

    ensureGtag();

    const state = getGoogleAnalyticsState(measurementId);

    setDefaultConsent(state);

    const storedConsent = getAnalyticsConsent();

    if (storedConsent) {
        applyConsent(state, storedConsent);
    }

    configureGoogleAnalytics(state);
    ensureGoogleAnalyticsScript(measurementId);

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

export function updateGoogleAnalyticsConsent(
    rawMeasurementId: string | undefined | null,
    value: AnalyticsConsent
) {
    if (!browser) return false;

    const measurementId = normalizeMeasurementId(rawMeasurementId);

    if (!measurementId) return false;

    setAnalyticsConsent(value);

    if (!initGoogleAnalytics(measurementId)) return false;

    const state = getGoogleAnalyticsState(measurementId);
    applyConsent(state, value);

    if (value === 'denied') {
        expireAnalyticsCookies();
    }

    return true;
}

/**
 * Backward-compatible alias. In advanced Consent Mode, denying consent keeps the
 * Google tag loaded while preventing Analytics cookies and identifiers.
 */
export function disableGoogleAnalytics(rawMeasurementId: string | undefined | null) {
    updateGoogleAnalyticsConsent(rawMeasurementId, 'denied');
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
