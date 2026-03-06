<script>
  let { data, form } = $props();
  let event = $derived(data?.event);
  let mediaBlocks = $state('[]');
  let preview = $state('');

  $effect(() => {
    mediaBlocks = JSON.stringify(event?.mediaBlocks || [], null, 2);
    preview = event?.image || '';
  });

  function addSnippet(type) {
    const arr = JSON.parse(mediaBlocks || '[]');
    if (type === 'image') arr.push({ type: 'image', src: '', alt: '' });
    if (type === 'video') arr.push({ type: 'video', src: '' });
    if (type === 'carousel') arr.push({ type: 'carousel', items: [{ type: 'image', src: '' }] });
    mediaBlocks = JSON.stringify(arr, null, 2);
  }

  function onFileChange(eventInput) {
    const file = eventInput.currentTarget.files?.[0];
    preview = file ? URL.createObjectURL(file) : event?.image || '';
  }
</script>

<h1 class="mb-4 text-2xl font-bold">Edit event: {event?.slug}</h1>
{#if form?.error}<p class="mb-3 text-red-700">{form.error}</p>{/if}
<form method="POST" enctype="multipart/form-data" action="?/save" class="grid gap-3 rounded border border-slate-200 bg-white p-4 md:grid-cols-2">
  <input name="slug" value={event?.slug} class="rounded border px-3 py-2" required />
  <input type="date" name="date" value={event?.date} class="rounded border px-3 py-2" required />
  <input name="title_el" value={event?.title?.el} class="rounded border px-3 py-2" required />
  <input name="title_de" value={event?.title?.de} class="rounded border px-3 py-2" required />
  <textarea name="excerpt_el" class="rounded border px-3 py-2">{event?.excerpt?.el}</textarea>
  <textarea name="excerpt_de" class="rounded border px-3 py-2">{event?.excerpt?.de}</textarea>
  <div class="md:col-span-2">
    <label class="mb-1 block text-sm font-semibold">Main image upload</label>
    <input name="image" type="file" accept="image/*" class="block w-full" onchange={onFileChange} />
    {#if preview}<img src={preview} alt="preview" class="mt-2 h-20 w-20 rounded object-cover" />{/if}
  </div>
  <textarea name="content_el" class="min-h-40 rounded border px-3 py-2">{event?.content?.el}</textarea>
  <textarea name="content_de" class="min-h-40 rounded border px-3 py-2">{event?.content?.de}</textarea>

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
