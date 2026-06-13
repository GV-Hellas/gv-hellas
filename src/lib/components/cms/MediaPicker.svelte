<script lang="ts">
    import type { EventMedia } from '$lib/cms/events/types';

    export let media: EventMedia[] = [];
    export let onFiles: (items: { media: EventMedia; file: File }) => void;

    const previews = new Map<string, string>();

    function mediaType(file: File): EventMedia['type'] {
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.startsWith('video/')) return 'video';
        return 'audio';
    }

    function addFiles(files: FileList | null) {
        if (!files) return;

        for (const file of [...files]) {
            const id = crypto.randomUUID();
            const uploadKey = `media_${id}`;

            const item: EventMedia = {
                id,
                uploadKey,
                type: mediaType(file),
                filename: file.name,
                mimeType: file.type,
                alt: { el: '', de: '' }
            };

            previews.set(id, URL.createObjectURL(file));
            media = [...media, item];
            onFiles({ media: item, file });
        }
    }

    function remove(id: string) {
        media = media.filter((m) => m.id !== id);
        const url = previews.get(id);
        if (url) URL.revokeObjectURL(url);
        previews.delete(id);
    }
</script>

<div class="media">
    <label class="drop">
        <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                on:change={(e) => addFiles(e.currentTarget.files)}
        />
        <span>Add photos, videos or audio</span>
        <small>Multiple files allowed</small>
    </label>

    {#if media.length}
        <div class="grid">
            {#each media as item}
                <div class="preview">
                    {#if item.type === 'image'}
                        <img src={previews.get(item.id) || item.url} alt="" />
                    {:else if item.type === 'video'}
                        <!-- svelte-ignore a11y_media_has_caption -->
                        <video src={previews.get(item.id) || item.url} controls></video>
                    {:else}
                        <audio src={previews.get(item.id) || item.url} controls></audio>
                    {/if}

                    <div class="meta">
                        <small>{item.filename}</small>
                        <button type="button" on:click={() => remove(item.id)}>Remove</button>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .media { display: grid; gap: .75rem; }
    .drop {
        border: 1px dashed #98a2b3;
        border-radius: .9rem;
        padding: 1rem;
        display: grid;
        gap: .2rem;
        place-items: center;
        cursor: pointer;
        background: #f9fafb;
    }
    .drop input { display: none; }
    .drop span { font-weight: 700; }
    .drop small { color: #667085; }
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: .75rem;
    }
    .preview {
        border: 1px solid #eaecf0;
        border-radius: .8rem;
        overflow: hidden;
        background: white;
    }
    img, video {
        width: 100%;
        height: 130px;
        object-fit: cover;
        display: block;
    }
    audio {
        width: 100%;
        padding: .75rem;
    }
    .meta {
        display: flex;
        justify-content: space-between;
        gap: .5rem;
        align-items: center;
        padding: .5rem;
    }
    button {
        border: 0;
        background: #fee2e2;
        color: #991b1b;
        border-radius: .5rem;
        padding: .3rem .5rem;
        cursor: pointer;
    }
</style>