<script lang="ts">
    let {data} = $props();
</script>

<h1 class="mb-4 text-2xl font-bold">Edit equipment</h1>
<form method="POST" enctype="multipart/form-data" action="?/save" class="grid gap-3 rounded border border-slate-200 bg-white p-4 md:grid-cols-2">
    <input name="name" value={data.item.name} placeholder="Equipment model name" class="rounded border px-3 py-2" required/>
    <input name="brand" value={data.item.brand} placeholder="Brand" class="rounded border px-3 py-2"/>
    <input name="model_year" value={data.item.modelYear} placeholder="Model year" class="rounded border px-3 py-2"/>
    <input name="price_per_day" type="number" step="0.01" value={data.item.pricePerDay} placeholder="Price per day" class="rounded border px-3 py-2"/>
    <textarea name="description" placeholder="Description" class="min-h-28 rounded border px-3 py-2 md:col-span-2">{data.item.description}</textarea>

    <div class="md:col-span-2 grid gap-3 md:grid-cols-3">
        {#each [0, 1, 2] as idx}
            <div>
                <input name={`image${idx + 1}`} type="file" accept="image/*" class="rounded border px-3 py-2"/>
                {#if data.item.images[idx]?.src}<img src={data.item.images[idx].src} alt="current" class="mt-2 h-16 w-16 rounded object-cover"/>{/if}
            </div>
        {/each}
    </div>

    <div class="md:col-span-2">
        <input name="video" type="file" accept="video/*" class="rounded border px-3 py-2"/>
        {#if data.item.video}
            <!-- svelte-ignore a11y_media_has_caption -->
            <video src={data.item.video} controls class="mt-2 h-24"></video>
        {/if}
    </div>
    <button class="rounded bg-primary px-4 py-2 text-white md:col-span-2">Save</button>
</form>
