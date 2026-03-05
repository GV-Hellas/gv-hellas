<script>
  let { data, children } = $props();

  const menu = [
    { href: '/admin/events', label: 'Events' },
    { href: '/admin/gallery', label: 'Gallery' },
    { href: '/admin/links', label: 'Links' },
    { href: '/admin/businesses', label: 'Businesses' },
    { href: '/admin/equipment', label: 'Equipment' }
  ];
</script>

{#if data.authenticated}
  <header class="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <a href="/admin/events" class="flex items-center gap-3">
        <img src="/images/logo.svg" alt="logo" class="h-12 w-12 rounded-lg object-cover" />
        <div>
          <p class="text-xs font-semibold tracking-[0.2em] text-slate-500">ADMIN</p>
          <p class="text-sm font-semibold text-slate-900">Griechischer Verein Hellas</p>
        </div>
      </a>
      <form method="POST" action="/admin?/logout"><button class="rounded border px-3 py-2">Logout</button></form>
    </div>
    <nav class="mt-4 flex flex-wrap gap-2">
      {#each menu as item}
        <a href={item.href} class="rounded border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">{item.label}</a>
      {/each}
    </nav>
  </header>
{/if}

{@render children()}
