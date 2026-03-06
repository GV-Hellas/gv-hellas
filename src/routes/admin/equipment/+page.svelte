<script>
  let { data } = $props();
</script>

<div class="mb-4 flex items-center justify-between">
  <h1 class="text-2xl font-bold">Equipment</h1>
  <a href="/admin/equipment/create" class="rounded bg-primary px-4 py-2 text-white">Create new</a>
</div>

<div class="overflow-x-auto rounded border border-slate-200 bg-white">
  <table class="min-w-full text-sm">
    <thead class="bg-slate-100"><tr><th class="px-3 py-2 text-left">Name</th><th class="px-3 py-2 text-left">Brand</th><th class="px-3 py-2 text-left">Year</th><th class="px-3 py-2 text-left">Price/Day</th><th class="px-3 py-2 text-left">Actions</th></tr></thead>
    <tbody>
      {#each data.equipment as item}
        <tr class="border-t">
          <td class="px-3 py-2">{item.name}</td><td class="px-3 py-2">{item.brand}</td><td class="px-3 py-2">{item.modelYear}</td><td class="px-3 py-2">CHF {item.pricePerDay}</td>
          <td class="px-3 py-2">
            <a class="mr-3 text-primary" href={`/admin/equipment/${item.id}/edit`}>Edit</a>
            <form method="POST" action="?/delete" class="inline"><input type="hidden" name="id" value={item.id} /><button class="text-red-600">Delete</button></form>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
