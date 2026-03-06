<script>
  let { data, form } = $props();
  let preview = $state('');
  function onFileChange(event) {
    const file = event.currentTarget.files?.[0];
    preview = file ? URL.createObjectURL(file) : '';
  }
</script>

<h1 class="mb-4 text-2xl font-bold">Create gallery item</h1>
{#if form?.error}<p class="mb-3 text-red-700">{form.error}</p>{/if}
<form method="POST" enctype="multipart/form-data" action="?/save" class="grid gap-3 rounded border border-slate-200 bg-white p-4 md:grid-cols-2">
  <input name="id" placeholder="id (optional)" class="rounded border px-3 py-2" />
  <input name="alt" placeholder="Alt text" class="rounded border px-3 py-2" />
  <div class="md:col-span-2">
    <label class="mb-1 block text-sm font-semibold">Image upload</label>
    <input name="image" type="file" accept="image/*" class="block w-full" onchange={onFileChange} required />
    {#if preview}<img src={preview} alt="preview" class="mt-3 h-20 w-20 rounded object-cover" />{/if}
  </div>
  <input name="tags" placeholder="Tags comma-separated (e.g. fasnacht,verein)" class="rounded border px-3 py-2 md:col-span-2" />
  <p class="text-xs text-slate-500 md:col-span-2">Existing tags: {data.tags.join(', ')}</p>
  <button class="rounded bg-primary px-4 py-2 text-white md:col-span-2">Save</button>
</form>
