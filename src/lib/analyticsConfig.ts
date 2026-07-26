export const ANALYTICS_CONSENT_STORAGE_KEY = 'gv-hellas.analytics-consent.v1';
export const GOOGLE_ANALYTICS_SCRIPT_ID = 'gv-hellas-google-analytics';

export function normalizeMeasurementId(value: string | undefined | null) {
    const measurementId = String(value || '').trim().toUpperCase();

    return /^G-[A-Z0-9]+$/.test(measurementId) ? measurementId : '';
}
