<script lang="ts">
    import "../app.css";
    import { page } from "$app/state";
    import { fade, fly } from "svelte/transition";

    import Nav from "$lib/components/Nav.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import { Toaster } from "$lib/components/ui/sonner";
</script>

<div class="flex min-h-screen flex-col bg-slate-50 text-slate-900">

    <Toaster richColors closeButton position="top-right" />

    <Nav />

    {#key page.url.pathname}
        <main
                class="container mx-auto w-full max-w-7xl flex-1 px-4 py-8 lg:px-6"
                in:fly={{ y: 8, duration: 140 }}
                out:fade={{ duration: 80 }}
        >
            <slot />
        </main>
    {/key}

    <Footer />
</div>
