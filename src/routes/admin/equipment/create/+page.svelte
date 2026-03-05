<h1 class="mb-4 text-2xl font-bold">Create equipment</h1>
<form method="POST" enctype="multipart/form-data" action="?/save" class="grid gap-3 rounded border border-slate-200 bg-white p-4 md:grid-cols-2">
  <input name="name" placeholder="Equipment model name" class="rounded border px-3 py-2" required />
  <input name="brand" placeholder="Brand" class="rounded border px-3 py-2" />
  <input name="model_year" placeholder="Model year" class="rounded border px-3 py-2" />
  <input name="price_per_day" type="number" step="0.01" placeholder="Price per day" class="rounded border px-3 py-2" />
  <textarea name="description" placeholder="Description" class="min-h-28 rounded border px-3 py-2 md:col-span-2"></textarea>
  <div class="md:col-span-2 grid gap-3 md:grid-cols-3">
    <input name="image1" type="file" accept="image/*" class="rounded border px-3 py-2" />
    <input name="image2" type="file" accept="image/*" class="rounded border px-3 py-2" />
    <input name="image3" type="file" accept="image/*" class="rounded border px-3 py-2" />
  </div>
  <input name="video" type="file" accept="video/*" class="rounded border px-3 py-2 md:col-span-2" />
  <button class="rounded bg-primary px-4 py-2 text-white md:col-span-2">Save</button>
</form>
