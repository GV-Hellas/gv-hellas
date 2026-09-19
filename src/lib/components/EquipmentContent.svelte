<script lang="ts">
    import type {EquipmentSection, Lang} from '$lib/cms/equipment/types';

    let {
        sections,
        lang,
        fallbackAlt = ''
    }: {
        sections: EquipmentSection[];
        lang: Lang;
        fallbackAlt?: string;
    } = $props();

    function htmlOf(value: {el?: string; de?: string} | undefined) {
        return value?.[lang] || value?.el || value?.de || '';
    }

    function mediaAlt(media: any) {
        return media?.alt?.[lang] || media?.alt?.el || media?.alt?.de || media?.filename || fallbackAlt;
    }
</script>

<div class="equipment-body">
    {#each sections || [] as section}
        {#if htmlOf(section.beforeHtml)}
            <div class="prose max-w-none">
                {@html htmlOf(section.beforeHtml)}
            </div>
        {/if}

        {#if section.media?.length === 1}
            {@const media = section.media[0]}

            {#if media.type === 'image'}
                <img
                    src={media.url}
                    alt={mediaAlt(media)}
                    class="w-full border border-slate-200"
                    loading="lazy"
                />
            {:else if media.type === 'video'}
                <video controls class="w-full border border-slate-200">
                    <source src={media.url} type={media.mimeType || undefined} />
                </video>
            {:else if media.type === 'audio'}
                <audio controls class="w-full">
                    <source src={media.url} type={media.mimeType || undefined} />
                </audio>
            {/if}
        {:else if section.media?.length > 1}
            <div class="grid gap-3 md:grid-cols-2">
                {#each section.media as media}
                    {#if media.type === 'image'}
                        <img
                            src={media.url}
                            alt={mediaAlt(media)}
                            class="w-full border border-slate-200"
                            loading="lazy"
                        />
                    {:else if media.type === 'video'}
                        <video controls class="w-full border border-slate-200">
                            <source src={media.url} type={media.mimeType || undefined} />
                        </video>
                    {:else if media.type === 'audio'}
                        <div class="border border-slate-200 p-4">
                            <audio controls class="w-full">
                                <source src={media.url} type={media.mimeType || undefined} />
                            </audio>
                        </div>
                    {/if}
                {/each}
            </div>
        {/if}

        {#if htmlOf(section.afterHtml)}
            <div class="prose max-w-none">
                {@html htmlOf(section.afterHtml)}
            </div>
        {/if}
    {/each}
</div>

<style>
    .equipment-body {
        display: grid;
        gap: 0;
    }

    .equipment-body :global(.prose p:empty) {
        display: none;
    }

    .equipment-body :global(.prose p) {
        margin-block: 0.75rem;
    }

    .equipment-body img,
    .equipment-body video,
    .equipment-body audio {
        margin-block: 0.75rem;
    }
</style>
