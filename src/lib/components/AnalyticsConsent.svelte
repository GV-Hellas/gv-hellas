<script lang="ts">
    import {onMount} from 'svelte';

    import {t} from '$lib/i18n';
    import {Button} from '$lib/components/ui/button/index.js';
    import {
        disableGoogleAnalytics,
        getAnalyticsConsent,
        normalizeMeasurementId,
        setAnalyticsConsent
    } from '$lib/analytics';

    let {
        measurementId = '',
        enabled = true,
        onGranted
    }: {
        measurementId?: string;
        enabled?: boolean;
        onGranted?: () => void;
    } = $props();

    let open = $state(false);

    function refreshVisibility() {
        open = Boolean(
            enabled &&
            normalizeMeasurementId(measurementId) &&
            getAnalyticsConsent() === null
        );
    }

    function accept() {
        setAnalyticsConsent('granted');
        open = false;
        onGranted?.();
    }

    function reject() {
        setAnalyticsConsent('denied');
        disableGoogleAnalytics(measurementId);
        open = false;
    }

    onMount(() => {
        refreshVisibility();

        const reopen = () => {
            if (!enabled || !normalizeMeasurementId(measurementId)) return;
            open = true;
        };

        window.addEventListener('gvhellas:open-analytics-settings', reopen);

        return () => {
            window.removeEventListener('gvhellas:open-analytics-settings', reopen);
        };
    });

    $effect(() => {
        if (!enabled || !normalizeMeasurementId(measurementId)) {
            open = false;
            return;
        }

        if (getAnalyticsConsent() === null) {
            open = true;
        }
    });
</script>

{#if open}
    <section
        class="fixed inset-x-4 bottom-4 z-[10001] mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
        aria-labelledby="analytics-consent-title"
        aria-describedby="analytics-consent-description"
        aria-live="polite"
    >
        <div class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div class="max-w-2xl">
                <h2 id="analytics-consent-title" class="font-bold text-slate-950">
                    {$t('analytics.consent.title')}
                </h2>

                <p id="analytics-consent-description" class="mt-2 text-sm leading-6 text-slate-600">
                    {$t('analytics.consent.description')}
                </p>
            </div>

            <div class="flex shrink-0 flex-wrap gap-2">
                <Button type="button" variant="outline" class="rounded-xl" onclick={reject}>
                    {$t('analytics.consent.reject')}
                </Button>

                <Button type="button" class="rounded-xl" onclick={accept}>
                    {$t('analytics.consent.accept')}
                </Button>
            </div>
        </div>
    </section>
{/if}
