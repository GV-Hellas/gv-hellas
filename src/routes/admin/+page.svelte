<script>
  let { data, form } = $props();
</script>

{#if !data.authenticated}
  <section class="mx-auto mt-10 max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h1 class="text-2xl font-bold">CMS Admin Login</h1>
    <p class="mt-2 text-sm text-slate-600">Use your CMS credentials to manage events and gallery items.</p>

    {#if form?.error}
      <p class="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{form.error}</p>
    {/if}

    <form method="POST" action="?/login" class="mt-4 space-y-3">
      <input name="username" placeholder="Username" class="w-full rounded border border-slate-300 px-3 py-2" required />
      <input name="password" type="password" placeholder="Password" class="w-full rounded border border-slate-300 px-3 py-2" required />
      <button class="rounded bg-primary px-4 py-2 font-semibold text-white">Login</button>
    </form>
  </section>
{:else}
  <section class="space-y-8">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">CMS Admin</h1>
      <form method="POST" action="?/logout"><button class="rounded border border-slate-300 px-3 py-2">Logout</button></form>
    </div>

    <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="text-xl font-semibold">Add / Edit Event</h2>
      <form method="POST" action="?/saveEvent" class="mt-4 grid gap-3 md:grid-cols-2">
        <input name="slug" placeholder="slug" class="rounded border border-slate-300 px-3 py-2" required />
        <input name="date" type="date" class="rounded border border-slate-300 px-3 py-2" required />
        <input name="title_el" placeholder="Title EL" class="rounded border border-slate-300 px-3 py-2" required />
        <input name="title_de" placeholder="Title DE" class="rounded border border-slate-300 px-3 py-2" required />
        <input name="image" placeholder="Image URL" class="rounded border border-slate-300 px-3 py-2 md:col-span-2" required />
        <textarea name="excerpt_el" placeholder="Excerpt EL" class="rounded border border-slate-300 px-3 py-2"></textarea>
        <textarea name="excerpt_de" placeholder="Excerpt DE" class="rounded border border-slate-300 px-3 py-2"></textarea>
        <textarea name="content_el" placeholder="Content EL (HTML)" class="rounded border border-slate-300 px-3 py-2"></textarea>
        <textarea name="content_de" placeholder="Content DE (HTML)" class="rounded border border-slate-300 px-3 py-2"></textarea>
        <button class="rounded bg-primary px-4 py-2 font-semibold text-white md:col-span-2">Save event</button>
      </form>

      <div class="mt-6 space-y-2">
        {#each data.cms.events as event}
          <div class="flex items-center justify-between rounded border border-slate-200 px-3 py-2 text-sm">
            <span>{event.slug} — {event.title.el}</span>
            <form method="POST" action="?/deleteEvent">
              <input type="hidden" name="slug" value={event.slug} />
              <button class="text-red-600">Delete</button>
            </form>
          </div>
        {/each}
      </div>
    </article>

    <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="text-xl font-semibold">Add / Edit Gallery Image</h2>
      <form method="POST" action="?/saveGallery" class="mt-4 grid gap-3 md:grid-cols-2">
        <input name="id" placeholder="id (optional)" class="rounded border border-slate-300 px-3 py-2" />
        <input name="alt" placeholder="Alt text" class="rounded border border-slate-300 px-3 py-2" />
        <input name="src" placeholder="Image URL" class="rounded border border-slate-300 px-3 py-2 md:col-span-2" required />
        <button class="rounded bg-primary px-4 py-2 font-semibold text-white md:col-span-2">Save gallery image</button>
      </form>

      <div class="mt-6 space-y-2">
        {#each data.cms.gallery as item}
          <div class="flex items-center justify-between rounded border border-slate-200 px-3 py-2 text-sm">
            <span>{item.id} — {item.alt}</span>
            <form method="POST" action="?/deleteGallery">
              <input type="hidden" name="id" value={item.id} />
              <button class="text-red-600">Delete</button>
            </form>
          </div>
        {/each}
      </div>
    </article>
  </section>
{/if}
