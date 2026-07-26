<script lang="ts">
    import AdminBar from '$lib/components/cms/AdminBar.svelte';
</script>

<AdminBar />

<section class="mx-auto min-h-screen max-w-7xl border-2 border-admin px-4 py-8">
    <slot />
</section>
