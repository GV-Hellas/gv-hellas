<script>
  let { data, children } = $props();
</script>

{#if data.authenticated}
  <div class="mb-6 flex flex-wrap gap-2">
    <a href="/admin/events" class="rounded border px-3 py-2">Events</a>
    <a href="/admin/gallery" class="rounded border px-3 py-2">Gallery</a>
    <form method="POST" action="/admin?/logout"><button class="rounded border px-3 py-2">Logout</button></form>
  </div>
{/if}

{@render children()}
