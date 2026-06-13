<script lang="ts">
    import {t} from '$lib/i18n';
    import type {BusinessMedia, BusinessSection, Lang} from '$lib/cms/business/types';

    import LocalizedRichText from './LocalizedRichText.svelte';
    import MediaPicker from './MediaPicker.svelte';

    type Props = {
        section: BusinessSection;
        index: number;
        lang: Lang;
        onFiles: (items: { media: BusinessMedia; file: File }) => void;
        onRemove: () => void;
    };

    let {
        section = $bindable(),
        index,
        lang,
        onFiles,
        onRemove
    }: Props = $props();

    const languageSuffix = $derived(lang.toUpperCase());

    function localizedLabel(label: string) {
        return `${label} - ${languageSuffix}`;
    }
</script>

<section class="card">
    <div class="head">
        <h3>
            {$t('admin.businesses.form.section')} {index + 1}
        </h3>

        <button type="button" class="danger" onclick={onRemove}>
            {$t('admin.businesses.form.removeSection')}
        </button>
    </div>

    <LocalizedRichText
            label={localizedLabel($t('admin.businesses.form.textBeforeMedia'))}
            bind:value={section.beforeHtml}
            {lang}
    />

    <MediaPicker
            bind:media={section.media}
            {onFiles}
    />

    <LocalizedRichText
            label={localizedLabel($t('admin.businesses.form.textAfterMedia'))}
            bind:value={section.afterHtml}
            {lang}
    />
</section>

<style>
    .card {
        display: grid;
        gap: 1rem;
        border: 1px solid #eaecf0;
        border-radius: 1rem;
        background: #fff;
        padding: 1rem;
    }

    .head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }

    h3 {
        margin: 0;
        font-size: 1rem;
    }

    .danger {
        border: 0;
        background: #fee2e2;
        color: #991b1b;
        border-radius: .6rem;
        padding: .45rem .7rem;
        cursor: pointer;
    }

    .danger:hover {
        background: #fecaca;
    }
</style>