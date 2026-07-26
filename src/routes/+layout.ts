import {injectAnalytics} from '@vercel/analytics/sveltekit';
import {injectSpeedInsights} from '@vercel/speed-insights/sveltekit';
import {dev} from '$app/environment';

// SvelteKit already enables SSR by default. Keep it explicit so future changes
// cannot accidentally turn the public website into a client-only application.
export const ssr = true;
export const csr = true;

injectAnalytics({mode: dev ? 'development' : 'production'});
injectSpeedInsights();
