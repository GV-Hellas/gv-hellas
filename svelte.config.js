import adapter from '@sveltejs/adapter-vercel';
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),
    kit: {
        adapter: adapter({
            // The association and its audience are in Switzerland. Keeping the
            // server function in Frankfurt avoids the default iad1 round trip.
            regions: ['fra1']
        }),
        alias: {
            '@': './src',
        }
    }
};

export default config;