<script lang="ts">
    import type {Snippet} from 'svelte';

    import AdminBar from '$lib/components/cms/AdminBar.svelte';

    let {children}: {children: Snippet} = $props();
</script>

<AdminBar />

<section class="mx-auto min-h-screen max-w-7xl border-2 border-admin px-4 py-8">
    {@render children()}
</section>
