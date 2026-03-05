<script>
  import { locale, t } from '../i18n';
  import { goto } from '$app/navigation';

  // Navigation items with route segments
  const items = [
    { key: 'home', href: '/' },
    { key: 'events', href: '/events' },
    { key: 'links', href: '/links' },
    { key: 'gallery', href: '/gallery' },
    { key: 'contact', href: '/contact' },
    { key: 'businesses', href: '/businesses' },
    { key: 'equipment', href: '/equipment' },
    { key: 'church', href: '/church' }
  ];

  // Switch language when user selects a different locale
  function switchLanguage(lang) {
    locale.set(lang);
  }
</script>

<nav class="bg-primary text-white py-3 shadow-md">
  <div class="container mx-auto flex items-center justify-between px-4">
    <a href="/" class="font-bold text-xl">GV Hellas</a>
    <ul class="flex flex-wrap gap-4 text-sm">
      {#each items as item}
        <li>
          <a href={item.href} class="hover:underline">
            {$t(`nav.${item.key}`)}
          </a>
        </li>
      {/each}
    </ul>
    <div class="space-x-2">
      <button
        class="px-2 py-1 rounded bg-primary-light hover:bg-primary-dark transition"
        on:click={() => switchLanguage('el')}>
        EL
      </button>
      <button
        class="px-2 py-1 rounded bg-primary-light hover:bg-primary-dark transition"
        on:click={() => switchLanguage('de')}>
        DE
      </button>
    </div>
  </div>
</nav>