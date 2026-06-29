<script lang="ts">
    import {t} from '$lib/i18n';

    type GalleryItem = {
        id: string;
        type: 'image' | 'video';
        src480: string;
        src960: string;
        videoSrc: string;
        alt: string;
        tags: string[];
        width: number | null;
        height: number | null;
    };

    let {
        data,
        form
    }: {
        data: {item: GalleryItem; tags: string[]};
        form?: {errorKey?: string; message?: string};
    } = $props();

    let item = $derived(data.item);

    let preview = $state('');
    let previewType = $state<'image' | 'video' | ''>('');

    function formError() {
        if (form?.errorKey) return $t(form.errorKey);
        return form?.message || '';
    }

    function currentSrc(item: GalleryItem) {
        return item.type === 'video' ? item.videoSrc : item.src960 || item.src480;
    }

    $effect(() => {
        preview = currentSrc(item);
        previewType = item.type;
    });

    function onFileChange(event: Event) {
        const input = event.currentTarget as HTMLInputElement;
        const file = input.files?.[0];

        if (file) {
            if (preview && preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }

            preview = URL.createObjectURL(file);
            previewType = file.type.startsWith('video/') ? 'video' : 'image';
        } else {
            preview = currentSrc(item);
            previewType = item.type;
        }
    }
</script>

<svelte:head>
    <title>{$t('admin.gallery.editTitle')} - Admin</title>
</svelte:head>

<h1 class="mb-4 text-2xl font-bold">
    {$t('admin.gallery.editTitle')}: {item.id}
</h1>

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
            {$t('admin.gallery.id')}
        </label>
        <input
                id="id"
                value={item.id}
                class="w-full rounded border bg-slate-100 px-3 py-2 text-slate-500"
                readonly
        />
        <p class="mt-1 text-xs text-slate-500">
            {$t('admin.gallery.idReadonlyHelp')}
        </p>
    </div>

    <div>
        <label for="alt" class="mb-1 block text-sm font-semibold">
            {$t('admin.gallery.alt')}
        </label>
        <input
                id="alt"
                name="alt"
                value={item.alt}
                class="w-full rounded border px-3 py-2"
        />
    </div>

    <div class="md:col-span-2">
        <label for="media" class="mb-1 block text-sm font-semibold">
            {$t('admin.gallery.replaceMedia')}
        </label>
        <input
                id="media"
                name="media"
                type="file"
                accept="image/*,video/*"
                class="block w-full rounded border px-3 py-2"
                onchange={onFileChange}
        />

        <p class="mt-1 text-xs text-slate-500">
            {$t('admin.gallery.replaceMediaHelp')}
        </p>

        {#if preview}
            <div class="mt-3">
                {#if previewType === 'video'}
                    <video
                            src={preview}
                            class="h-48 max-w-full rounded bg-black object-contain"
                            controls
                            muted
                            playsinline
                    ></video>
                {:else}
                    <img
                            src={preview}
                            alt={item.alt || item.id}
                            class="h-48 max-w-full rounded object-cover"
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
                value={(item.tags || []).join(', ')}
                class="w-full rounded border px-3 py-2"
        />

        {#if data.tags.length}
            <p class="mt-2 text-xs text-slate-500">
                {$t('admin.gallery.existingTags')}: {data.tags.join(', ')}
            </p>
        {/if}
    </div>

    <div class="text-xs text-slate-500 md:col-span-2">
        {$t('admin.gallery.currentType')}:
        {$t(item.type === 'video' ? 'admin.gallery.video' : 'admin.gallery.image')}

        {#if item.type === 'image'}
            · 480w: {item.src480 ? $t('admin.gallery.yes') : $t('admin.gallery.no')}
            · 960w: {item.src960 ? $t('admin.gallery.yes') : $t('admin.gallery.no')}
            {#if item.width && item.height}
                · {item.width}×{item.height}
            {/if}
        {:else}
            · WebM
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