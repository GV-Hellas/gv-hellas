<script>
  import { page } from '$app/state';
  import { locale, t } from '$lib/i18n';

  const groups = [
    {
      key: 'community',
      items: [
        { key: 'events', href: '/events' },
        { key: 'gallery', href: '/gallery' },
        { key: 'church', href: '/church' }
      ]
    },
    {
      key: 'services',
      items: [
        { key: 'links', href: '/links' },
        { key: 'businesses', href: '/businesses' },
        { key: 'equipment', href: '/equipment' },
        { key: 'contact', href: '/contact' }
      ]
    }
  ];

  let mobileOpen = $state(false);

  function switchLanguage(lang) {
    locale.set(lang);
  }

  let currentPath = $derived(page.url.pathname);

  function isActive(href) {
    if (href === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(href);
  }
</script>

<nav class="sticky top-0 z-30 border-b border-white/10 bg-primary/95 text-white shadow-lg backdrop-blur">
  <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
    <div class="flex items-center gap-3">
      <a href="/" class="text-lg font-semibold tracking-wide md:text-xl">GV Hellas</a>
      <a
        href="/"
        class="hidden rounded-full border border-white/30 px-3 py-1 text-xs font-medium text-white/90 transition hover:bg-white/15 md:inline-flex"
      >
        {$t('nav.home')}
      </a>
    </div>

    <button
      class="rounded-lg border border-white/25 p-2 md:hidden"
      type="button"
      onclick={() => (mobileOpen = !mobileOpen)}
      aria-expanded={mobileOpen}
      aria-label="Toggle navigation"
    >
      ☰
    </button>

    <div class="hidden items-center gap-2 md:flex">
      {#each groups as group}
        <div class="relative group">
          <button class="rounded-full px-3 py-2 text-sm text-white/90 transition group-hover:bg-white/10">
            {$t(`nav.${group.key}`)}
          </button>
          <div class="absolute right-0 mt-2 hidden min-w-56 rounded-2xl border border-slate-200 bg-white p-2 text-slate-800 shadow-xl group-hover:block">
            {#each group.items as item}
              <a
                href={item.href}
                class={`block rounded-xl px-3 py-2 text-sm transition ${isActive(item.href) ? 'bg-primary text-white' : 'hover:bg-slate-100'}`}
              >
                {$t(`nav.${item.key}`)}
              </a>
            {/each}
          </div>
        </div>
      {/each}

      <div class="ml-2 flex rounded-full bg-white/10 p-1">
        <button
          type="button"
          class="rounded-full px-3 py-1 text-xs font-semibold transition"
          class:bg-white={$locale === 'el'}
          class:text-primary={$locale === 'el'}
          onclick={() => switchLanguage('el')}
        >
          EL
        </button>
        <button
          type="button"
          class="rounded-full px-3 py-1 text-xs font-semibold transition"
          class:bg-white={$locale === 'de'}
          class:text-primary={$locale === 'de'}
          onclick={() => switchLanguage('de')}
        >
          DE
        </button>
      </div>
    </div>
  </div>

  {#if mobileOpen}
    <div class="border-t border-white/15 px-4 pb-4 md:hidden">
      <a href="/" class="mt-3 block rounded-lg px-3 py-2 text-sm hover:bg-white/10">{$t('nav.home')}</a>
      {#each groups as group}
        <p class="mt-3 px-3 text-xs uppercase tracking-wide text-white/60">{$t(`nav.${group.key}`)}</p>
        {#each group.items as item}
          <a
            href={item.href}
            class={`mt-1 block rounded-lg px-3 py-2 text-sm ${isActive(item.href) ? 'bg-white/20' : 'hover:bg-white/10'}`}
          >
            {$t(`nav.${item.key}`)}
          </a>
        {/each}
      {/each}
      <div class="mt-4 flex gap-2 px-3">
        <button class="rounded bg-white/20 px-3 py-1 text-sm" type="button" onclick={() => switchLanguage('el')}>EL</button>
        <button class="rounded bg-white/20 px-3 py-1 text-sm" type="button" onclick={() => switchLanguage('de')}>DE</button>
      </div>
    </div>
  {/if}
</nav>
