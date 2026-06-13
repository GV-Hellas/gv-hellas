<script>
  let { data } = $props();
  let preview = $state('');
  $effect(() => { preview = data.item.logo || ''; });
  function onFileChange(event) {
    const file = event.currentTarget.files?.[0];
    preview = file ? URL.createObjectURL(file) : data.item.logo || '';
  }
</script>

<h1 class="mb-4 text-2xl font-bold">Edit business</h1>
<form method="POST" enctype="multipart/form-data" action="?/save" class="grid gap-3 rounded border border-slate-200 bg-white p-4 md:grid-cols-2">
  <input name="name" value={data.item.name} placeholder="Business name" class="rounded border px-3 py-2" required />
  <input name="url" type="url" value={data.item.url} placeholder="https://..." class="rounded border px-3 py-2" required />
  <div class="md:col-span-2">
    <label class="mb-1 block text-sm font-semibold">Logo upload</label>
    <input name="logo" type="file" accept="image/*" class="block w-full" onchange={onFileChange} />
    {#if preview}<img src={preview} alt="preview" class="mt-3 h-20 w-20 rounded object-cover" />{/if}
  </div>
  <button class="rounded bg-primary px-4 py-2 text-white md:col-span-2">Save</button>
</form>
