<script lang="ts">
  import '../app.css';
  import Nav from '$lib/components/Nav.svelte';
  import Footer from '$lib/components/Footer.svelte';

  let { children } = $props();
</script>

<div class="min-h-screen bg-slate-50 text-slate-900">
  <Nav />
  <main class="mx-auto w-full max-w-7xl px-4 py-8 lg:px-6">
    {@render children()}
  </main>
  <Footer />
</div>
