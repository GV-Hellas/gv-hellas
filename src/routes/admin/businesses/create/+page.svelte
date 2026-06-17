<script lang="ts">
  import BusinessForm from '$lib/components/cms/BusinessForm.svelte';
</script>

<svelte:head>
  <title>Create business | Griechischer Verein Hellas</title>
</svelte:head>

<BusinessForm
        mode="create"
        submitTo="?/save"
/>