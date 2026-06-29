<script lang="ts">
    import {page} from "$app/state";
    import {fade, fly} from "svelte/transition";

    import AdminBar from "$lib/components/cms/AdminBar.svelte";
</script>

<AdminBar/>

{#key page.url.pathname}
    <section
            class="mx-auto min-h-screen max-w-7xl px-4 py-8 border-2 border-admin"
            in:fly={{ y: 8, duration: 140 }}
            out:fade={{ duration: 80 }}
    >
        <slot/>
    </section>
{/key}