import {sveltekit} from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import {defineConfig} from 'vite';

const lucideIcons = [
    '@lucide/svelte/icons/arrow-left',
    '@lucide/svelte/icons/building-2',
    '@lucide/svelte/icons/check',
    '@lucide/svelte/icons/chevron-down',
    '@lucide/svelte/icons/chevron-left',
    '@lucide/svelte/icons/chevron-right',
    '@lucide/svelte/icons/chevron-up',
    '@lucide/svelte/icons/circle',
    '@lucide/svelte/icons/circle-check',
    '@lucide/svelte/icons/external-link',
    '@lucide/svelte/icons/file-image',
    '@lucide/svelte/icons/globe-2',
    '@lucide/svelte/icons/image',
    '@lucide/svelte/icons/info',
    '@lucide/svelte/icons/languages',
    '@lucide/svelte/icons/link',
    '@lucide/svelte/icons/loader-2',
    '@lucide/svelte/icons/mail',
    '@lucide/svelte/icons/minus',
    '@lucide/svelte/icons/octagon-x',
    '@lucide/svelte/icons/pencil',
    '@lucide/svelte/icons/phone',
    '@lucide/svelte/icons/save',
    '@lucide/svelte/icons/tags',
    '@lucide/svelte/icons/trash-2',
    '@lucide/svelte/icons/triangle-alert',
    '@lucide/svelte/icons/user-round',
    '@lucide/svelte/icons/video',
    '@lucide/svelte/icons/x'
];

export default defineConfig({
    plugins: [
        tailwindcss(),
        sveltekit()
    ],
    optimizeDeps: {
        // SvelteKit route modules are loaded lazily in development. Pre-bundling
        // the icons used by those routes prevents Vite from discovering a new
        // Lucide dependency mid-navigation and reloading the current page.
        include: lucideIcons
    },
    server: {
        fs: {
            allow: ['..']
        }
    }
});
