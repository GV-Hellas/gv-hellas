<script lang="ts">
    import {navigating} from '$app/state';
    import {t} from '$lib/i18n';

    const loading = $derived(navigating.to !== null);
</script>

{#if loading}
    <div
        class="fixed inset-x-0 top-0 z-[10000] h-1 overflow-hidden bg-primary/15"
        role="progressbar"
        aria-label={$t('navigation.loading')}
        aria-valuetext={$t('navigation.loading')}
    >
        <div class="progress-indicator h-full w-2/5 rounded-r-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.65)]"></div>
    </div>

    <div
        class="fixed inset-0 z-[9998] cursor-progress bg-white/10 backdrop-blur-[1px]"
        aria-hidden="true"
    ></div>

    <div
        class="pointer-events-none fixed inset-x-0 top-4 z-[9999] flex justify-center px-4"
        aria-live="polite"
        aria-atomic="true"
    >
        <div class="rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-sm font-medium text-slate-700 shadow-lg backdrop-blur">
            {$t('navigation.loading')}
        </div>
    </div>
{/if}
