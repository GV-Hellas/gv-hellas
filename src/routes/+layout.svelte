<script lang="ts">
    import '../app.css';

    import {afterNavigate} from '$app/navigation';
    import {page} from '$app/state';
    import {env} from '$env/dynamic/public';
    import {onMount, type Snippet} from 'svelte';

    import Nav from '$lib/components/Nav.svelte';
    import Footer from '$lib/components/Footer.svelte';
    import NavigationProgress from '$lib/components/NavigationProgress.svelte';
    import AnalyticsConsent from '$lib/components/AnalyticsConsent.svelte';
    import {Toaster} from '$lib/components/ui/sonner';
    import {
        getAnalyticsConsent,
        initGoogleAnalytics,
        trackPageView
    } from '$lib/analytics';

    let {children}: {children: Snippet} = $props();

    const measurementId = $derived(env.PUBLIC_GOOGLE_ANALYTICS_ID || '');
    const analyticsEnabled = $derived(!page.url.pathname.startsWith('/admin'));

    let lastTrackedLocation = '';

    function trackCurrentPage(referrer = '') {
        if (!analyticsEnabled || getAnalyticsConsent() !== 'granted') return;
        if (!initGoogleAnalytics(measurementId)) return;

        const location = window.location.href;

        if (lastTrackedLocation === location) return;

        lastTrackedLocation = location;

        requestAnimationFrame(() => {
            trackPageView({
                measurementId,
                location,
                title: document.title,
                referrer
            });
        });
    }

    function onAnalyticsGranted() {
        lastTrackedLocation = '';
        trackCurrentPage(document.referrer);
    }

    onMount(() => {
        trackCurrentPage(document.referrer);
    });

    afterNavigate(({from, to}) => {
        if (!to || to.url.pathname.startsWith('/admin')) return;

        trackCurrentPage(from?.url.href || document.referrer);
    });
</script>

<div class="flex min-h-screen flex-col bg-slate-50 text-slate-900">
    <Toaster richColors closeButton position="top-right" />
    <NavigationProgress />

    <Nav />

    {#key `${page.url.pathname}${page.url.search}`}
        <main class="page-enter container mx-auto w-full max-w-7xl flex-1 px-4 py-8 lg:px-6">
            {@render children()}
        </main>
    {/key}

    <Footer />

    <AnalyticsConsent
        {measurementId}
        enabled={analyticsEnabled}
        onGranted={onAnalyticsGranted}
    />
</div>

<style>
    .page-enter {
        animation: page-enter 160ms ease-out both;
    }

    @keyframes page-enter {
        from {
            opacity: 0;
            transform: translateY(6px);
        }

        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .page-enter {
            animation: none;
        }
    }
</style>
