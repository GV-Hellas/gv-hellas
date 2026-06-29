<script lang="ts">
    import {t} from '$lib/i18n';

    let {
        data,
        form
    }: {
        data: {tags: string[]};
        form?: {errorKey?: string; message?: string};
    } = $props();

    let preview = $state('');
    let previewType = $state<'image' | 'video' | ''>('');

    function formError() {
        if (form?.errorKey) return $t(form.errorKey);
        return form?.message || '';
    }

    function onFileChange(event: Event) {
        const input = event.currentTarget as HTMLInputElement;
        const file = input.files?.[0];

        if (preview && preview.startsWith('blob:')) {
            URL.revokeObjectURL(preview);
        }

        preview = file ? URL.createObjectURL(file) : '';
        previewType = file?.type.startsWith('video/') ? 'video' : file ? 'image' : '';
    }
</script>

<svelte:head>
    <title>{$t('admin.gallery.createTitle')} - Admin</title>
</svelte:head>

<h1 class="mb-4 text-2xl font-bold">{$t('admin.gallery.createTitle')}</h1>

{#if formError()}
    <p class="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {formError()}
        {#if form?.message}
            <span class="block text-xs opacity-80">{form.message}</span>
        {/if}
    </p>
{/if}

<form
        method="POST"
        enctype="multipart/form-data"
        action="?/save"
        class="grid gap-4 rounded border border-slate-200 bg-white p-4 md:grid-cols-2"
>
    <div>
        <label for="id" class="mb-1 block text-sm font-semibold">
            {$t('admin.gallery.idOptional')}
        </label>
        <input
                id="id"
                name="id"
                placeholder="g-example"
                class="w-full rounded border px-3 py-2"
        />
        <p class="mt-1 text-xs text-slate-500">
            {$t('admin.gallery.idHelp')}
        </p>
    </div>

    <div>
        <label for="alt" class="mb-1 block text-sm font-semibold">
            {$t('admin.gallery.alt')}
        </label>
        <input
                id="alt"
                name="alt"
                placeholder={$t('admin.gallery.altPlaceholder')}
                class="w-full rounded border px-3 py-2"
        />
    </div>

    <div class="md:col-span-2">
        <label for="media" class="mb-1 block text-sm font-semibold">
            {$t('admin.gallery.mediaUpload')}
        </label>
        <input
                id="media"
                name="media"
                type="file"
                accept="image/*,video/*"
                class="block w-full rounded border px-3 py-2"
                onchange={onFileChange}
                required
        />

        <p class="mt-1 text-xs text-slate-500">
            {$t('admin.gallery.mediaUploadHelp')}
        </p>

        {#if preview}
            <div class="mt-3">
                {#if previewType === 'video'}
                    <video
                            src={preview}
                            class="h-40 max-w-full rounded bg-black object-contain"
                            controls
                            muted
                            playsinline
                    />
                {:else}
                    <img
                            src={preview}
                            alt={$t('admin.gallery.preview')}
                            class="h-40 max-w-full rounded object-cover"
                    />
                {/if}
            </div>
        {/if}
    </div>

    <div class="md:col-span-2">
        <label for="tags" class="mb-1 block text-sm font-semibold">
            {$t('admin.gallery.tags')}
        </label>
        <input
                id="tags"
                name="tags"
                placeholder={$t('admin.gallery.tagsPlaceholder')}
                class="w-full rounded border px-3 py-2"
        />

        {#if data.tags.length}
            <p class="mt-2 text-xs text-slate-500">
                {$t('admin.gallery.existingTags')}: {data.tags.join(', ')}
            </p>
        {/if}
    </div>

    <div class="flex gap-3 md:col-span-2">
        <button type="submit" class="rounded bg-primary px-4 py-2 font-semibold text-white">
            {$t('admin.gallery.save')}
        </button>

        <a href="/admin/gallery" class="rounded border px-4 py-2 font-semibold text-slate-700">
            {$t('admin.gallery.cancel')}
        </a>
    </div>
</form>