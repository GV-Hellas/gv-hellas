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

  const socials = [
    { name: 'Facebook', href: 'https://www.facebook.com', icon: 'M22 12a10 10 0 1 0-11.56 9.87v-6.98h-2.1V12h2.1V9.8c0-2.08 1.24-3.23 3.14-3.23.9 0 1.84.16 1.84.16v2.03h-1.04c-1.02 0-1.34.64-1.34 1.29V12h2.28l-.36 2.9h-1.92v6.98A10 10 0 0 0 22 12Z' },
    { name: 'Instagram', href: 'https://www.instagram.com', icon: 'M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2Zm0 7.9A3.1 3.1 0 1 1 12 8.9a3.1 3.1 0 0 1 0 6.2Zm6.12-8.1a1.12 1.12 0 1 1-2.24 0 1.12 1.12 0 0 1 2.24 0ZM21.3 8.1c-.05-1.05-.29-1.99-1.06-2.75-.76-.76-1.7-1-2.75-1.06C16.42 4.25 16.08 4.2 12 4.2s-4.42.05-5.49.1c-1.05.06-1.99.3-2.75 1.06-.77.76-1 1.7-1.06 2.75-.05 1.07-.1 1.41-.1 5.49s.05 4.42.1 5.49c.06 1.05.29 1.99 1.06 2.75.76.76 1.7 1 2.75 1.06 1.07.05 1.41.1 5.49.1s4.42-.05 5.49-.1c1.05-.06 1.99-.3 2.75-1.06.77-.76 1-1.7 1.06-2.75.05-1.07.1-1.41.1-5.49s-.05-4.42-.1-5.49Zm-1.95 10.57a3.12 3.12 0 0 1-1.76 1.76c-1.22.48-4.12.37-5.59.37s-4.37.1-5.59-.37a3.12 3.12 0 0 1-1.76-1.76c-.48-1.22-.37-4.12-.37-5.59s-.1-4.37.37-5.59a3.12 3.12 0 0 1 1.76-1.76c1.22-.48 4.12-.37 5.59-.37s4.37-.1 5.59.37a3.12 3.12 0 0 1 1.76 1.76c.48 1.22.37 4.12.37 5.59s.1 4.37-.37 5.59Z' },
    { name: 'TikTok', href: 'https://www.tiktok.com', icon: 'M16.6 5.82a4.75 4.75 0 0 0 2.78 2.12v2.53a7.3 7.3 0 0 1-2.77-.78v5.67A5.36 5.36 0 1 1 11.25 10a5.5 5.5 0 0 1 .75.05v2.61a2.75 2.75 0 1 0 1.98 2.64V2h2.62v3.82Z' }
  ];

  let mobileOpen = $state(false);
  let openDropdown = $state(null);
  let closeTimer;

  function openMenu(groupKey) {
    clearTimeout(closeTimer);
    openDropdown = groupKey;
  }

  function closeMenuWithDelay() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      openDropdown = null;
    }, 180);
  }

  function switchLanguage(lang) {
    locale.set(lang);
  }

  let currentPath = $derived(page.url.pathname);

  function isActive(href) {
    if (href === '/') return currentPath === '/';
    return currentPath.startsWith(href);
  }
</script>

<nav class="sticky top-0 z-30 border-b border-[#8ea8cf] bg-primary/95 text-slate-900 shadow-lg backdrop-blur-md">
  <div class="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 lg:px-6">
    <div class="flex min-w-[18rem] items-center gap-3">
      <a href="/" class="flex items-center gap-3">
        <img src="/images/logo.png" alt="GV Hellas" class="h-20 w-20 rounded-xl object-cover" />
        <span class="leading-tight text-sm font-black sm:text-lg">Griechischer Verein<br />Hellas</span>
      </a>
    </div>

    <button class="rounded-lg border border-white/25 p-2 md:hidden" type="button" onclick={() => (mobileOpen = !mobileOpen)}>
      ☰
    </button>

    <div class="hidden items-center gap-3 md:flex">
      <a href="/" class="rounded-full px-4 py-2.5 text-base font-extrabold text-slate-900 hover:bg-white/35">{$t('nav.home')}</a>
      {#each groups as group}
        <div class="relative">
          <button
            class="rounded-full px-4 py-2.5 text-base font-extrabold text-slate-900 transition hover:bg-white/35"
            type="button"
            onmouseenter={() => openMenu(group.key)}
            onmouseleave={closeMenuWithDelay}
            onfocus={() => openMenu(group.key)}
          >
            {$t(`nav.${group.key}`)}
          </button>
          <div
            class={`absolute right-0 top-full pt-2 ${openDropdown === group.key ? 'block' : 'hidden'}`}
            role="group"
            onmouseenter={() => openMenu(group.key)}
            onmouseleave={closeMenuWithDelay}
            onfocusin={() => openMenu(group.key)}
            onfocusout={closeMenuWithDelay}
          >
            <div class="min-w-60 rounded-2xl border border-slate-200 bg-white p-2 text-slate-800 shadow-xl">
              {#each group.items as item}
                <a href={item.href} class={`block rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive(item.href) ? 'bg-primary text-white' : 'hover:bg-slate-100'}`}>
                  {$t(`nav.${item.key}`)}
                </a>
              {/each}
            </div>
          </div>
        </div>
      {/each}
    </div>

    <div class="hidden items-center gap-2 md:flex">
      <div class="flex rounded-full bg-white/10 p-1">
        <button type="button" class="rounded-full px-3 py-1 text-xs font-bold transition" class:bg-white={$locale === 'el'} class:text-primary={$locale === 'el'} onclick={() => switchLanguage('el')}>EL</button>
        <button type="button" class="rounded-full px-3 py-1 text-xs font-bold transition" class:bg-white={$locale === 'de'} class:text-primary={$locale === 'de'} onclick={() => switchLanguage('de')}>DE</button>
      </div>
      <div class="ml-1 flex items-center gap-1">
        {#each socials as social}
          <a href={social.href} target="_blank" rel="noopener" aria-label={social.name} class="rounded-full p-2 transition hover:bg-white/35">
            <svg viewBox="0 0 24 24" class="h-5 w-5 fill-current"><path d={social.icon}></path></svg>
          </a>
        {/each}
      </div>
    </div>
  </div>

  {#if mobileOpen}
    <div class="border-t border-white/15 px-4 pb-4 md:hidden">
      <a href="/" class="mt-3 block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/30">{$t('nav.home')}</a>
      {#each groups as group}
        <p class="mt-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-700">{$t(`nav.${group.key}`)}</p>
        {#each group.items as item}
          <a href={item.href} class={`mt-1 block rounded-lg px-3 py-2 text-sm font-semibold ${isActive(item.href) ? 'bg-white/35' : 'hover:bg-white/30'}`}>
            {$t(`nav.${item.key}`)}
          </a>
        {/each}
      {/each}
      <div class="mt-4 flex items-center justify-between px-3">
        <div class="flex gap-2">
          <button class="rounded bg-white/35 px-3 py-1 text-sm font-semibold" type="button" onclick={() => switchLanguage('el')}>EL</button>
          <button class="rounded bg-white/35 px-3 py-1 text-sm font-semibold" type="button" onclick={() => switchLanguage('de')}>DE</button>
        </div>
        <div class="flex gap-2">
          {#each socials as social}
            <a href={social.href} target="_blank" rel="noopener" aria-label={social.name} class="rounded-full p-2 transition hover:bg-white/35">
              <svg viewBox="0 0 24 24" class="h-4 w-4 fill-current"><path d={social.icon}></path></svg>
            </a>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</nav>
