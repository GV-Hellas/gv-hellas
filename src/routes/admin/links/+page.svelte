<script>
  let { data } = $props();
</script>

<div class="mb-4 flex items-center justify-between">
  <h1 class="text-2xl font-bold">Links</h1>
  <a href="/admin/links/create" class="rounded bg-primary px-4 py-2 text-white">Create new</a>
</div>

<div class="overflow-x-auto rounded border border-slate-200 bg-white">
  <table class="min-w-full text-sm">
    <thead class="bg-slate-100">
      <tr><th class="px-3 py-2 text-left">Logo</th><th class="px-3 py-2 text-left">Title EL</th><th class="px-3 py-2 text-left">URL</th><th class="px-3 py-2 text-left">Actions</th></tr>
    </thead>
    <tbody>
      {#each data.links as item}
        <tr class="border-t">
          <td class="px-3 py-2">{#if item.logo}<img src={item.logo} alt="logo" class="h-9 w-9 rounded object-cover" />{/if}</td>
          <td class="px-3 py-2">{item.name.el}</td>
          <td class="px-3 py-2"><a href={item.url} class="text-primary-dark" target="_blank" rel="noopener">{item.url}</a></td>
          <td class="px-3 py-2">
            <a class="mr-3 text-primary-dark" href={`/admin/links/${item.id}/edit`}>Edit</a>
            <form method="POST" action="?/delete" class="inline">
              <input type="hidden" name="id" value={item.id} />
              <button class="text-red-600">Delete</button>
            </form>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
