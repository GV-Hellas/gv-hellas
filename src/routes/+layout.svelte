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
    <div class="pointer-events-none fixed inset-x-0 top-[4.65rem] z-40 flex justify-center px-4">
      <div class="h-1 w-full max-w-7xl overflow-hidden rounded-full bg-slate-200/80 shadow-sm">
        <div class="progress-indicator h-full w-1/3 rounded-full bg-primary"></div>
      </div>
    </div>
  {/if}

  <main class="mx-auto w-full max-w-7xl px-4 py-8 lg:px-6">
    {#key pathname}
      <div in:fade={{ duration: 140 }} out:fade={{ duration: 120 }}>
        {@render children()}
      </div>
    {/key}
  </main>

  <Footer />
</div>
