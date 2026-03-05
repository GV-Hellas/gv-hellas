<script lang="ts">
  import '../app.css';
  import { fade } from 'svelte/transition';
  import { navigating, page } from '$app/state';
  import Nav from '$lib/components/Nav.svelte';
  import Footer from '$lib/components/Footer.svelte';

  let { children } = $props();
  let pathname = $derived(page.url.pathname);
  let isNavigating = $derived(Boolean(navigating.to));
</script>

<div class="min-h-screen bg-slate-50 text-slate-900">
  <Nav />

  {#if isNavigating}
    <div class="pointer-events-none fixed inset-0 z-40 bg-slate-950/10 backdrop-blur-[1px]">
      <div class="absolute left-1/2 top-4 h-1 w-40 -translate-x-1/2 overflow-hidden rounded-full bg-white/70 shadow">
        <div class="progress-indicator h-full w-1/2 rounded-full bg-primary"></div>
      </div>
    </div>
  {/if}

  <main class="mx-auto w-full max-w-7xl px-4 py-8 lg:px-6">
    {#key pathname}
      <div in:fade={{ duration: 180 }} out:fade={{ duration: 130 }}>
        {@render children()}
      </div>
    {/key}
  </main>

  <Footer />
</div>
