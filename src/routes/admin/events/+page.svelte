<script>
  let { data } = $props();
</script>

<div class="mb-4 flex items-center justify-between">
  <h1 class="text-2xl font-bold">Events</h1>
  <a href="/admin/events/create" class="rounded bg-primary px-4 py-2 text-white">Create new</a>
</div>

<div class="overflow-x-auto rounded border border-slate-200 bg-white">
  <table class="min-w-full text-sm">
    <thead class="bg-slate-100">
      <tr><th class="px-3 py-2 text-left">Slug</th><th class="px-3 py-2 text-left">Date</th><th class="px-3 py-2 text-left">Title (EL)</th><th class="px-3 py-2 text-left">Actions</th></tr>
    </thead>
    <tbody>
      {#each data.events as event}
        <tr class="border-t">
          <td class="px-3 py-2">{event.slug}</td>
          <td class="px-3 py-2">{event.date}</td>
          <td class="px-3 py-2">{event.title.el}</td>
          <td class="px-3 py-2">
            <a class="mr-3 text-primary" href={`/admin/events/${event.slug}/edit`}>Edit</a>
            <form method="POST" action="?/delete" class="inline">
              <input type="hidden" name="slug" value={event.slug} />
              <button class="text-red-600">Delete</button>
            </form>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
