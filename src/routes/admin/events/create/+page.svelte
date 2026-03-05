<script>
  let mediaBlocks = $state('[]');
  let { form } = $props();

  function addSnippet(type) {
    const arr = JSON.parse(mediaBlocks || '[]');
    if (type === 'image') arr.push({ type: 'image', src: '', alt: '' });
    if (type === 'video') arr.push({ type: 'video', src: '' });
    if (type === 'carousel') arr.push({ type: 'carousel', items: [{ type: 'image', src: '' }] });
    mediaBlocks = JSON.stringify(arr, null, 2);
  }
</script>

<h1 class="mb-4 text-2xl font-bold">Create event</h1>
{#if form?.error}<p class="mb-3 text-red-700">{form.error}</p>{/if}
<form method="POST" action="?/save" class="grid gap-3 rounded border border-slate-200 bg-white p-4 md:grid-cols-2">
  <input name="slug" placeholder="slug" class="rounded border px-3 py-2" required />
  <input type="date" name="date" class="rounded border px-3 py-2" required />
  <input name="title_el" placeholder="Title EL" class="rounded border px-3 py-2" required />
  <input name="title_de" placeholder="Title DE" class="rounded border px-3 py-2" required />
  <textarea name="excerpt_el" placeholder="Excerpt EL" class="rounded border px-3 py-2"></textarea>
  <textarea name="excerpt_de" placeholder="Excerpt DE" class="rounded border px-3 py-2"></textarea>
  <input name="image" placeholder="Main image URL" class="rounded border px-3 py-2 md:col-span-2" />
  <textarea name="content_el" placeholder="Rich HTML EL" class="min-h-40 rounded border px-3 py-2"></textarea>
  <textarea name="content_de" placeholder="Rich HTML DE" class="min-h-40 rounded border px-3 py-2"></textarea>

  <div class="md:col-span-2 rounded border p-3">
    <p class="mb-2 text-sm font-semibold">Media blocks JSON (supports image/video/carousel)</p>
    <div class="mb-2 flex gap-2">
      <button type="button" class="rounded border px-2 py-1" onclick={() => addSnippet('image')}>+ Image block</button>
      <button type="button" class="rounded border px-2 py-1" onclick={() => addSnippet('video')}>+ Video block</button>
      <button type="button" class="rounded border px-2 py-1" onclick={() => addSnippet('carousel')}>+ Carousel block</button>
    </div>
    <textarea name="media_blocks" bind:value={mediaBlocks} class="min-h-36 w-full rounded border px-3 py-2 font-mono text-xs"></textarea>
  </div>

  <button class="rounded bg-primary px-4 py-2 text-white md:col-span-2">Save</button>
</form>
