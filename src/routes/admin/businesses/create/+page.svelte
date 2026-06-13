<script lang="ts">
  import BusinessForm from '$lib/components/cms/BusinessForm.svelte';
</script>

<svelte:head>
  <title>Create business | GV Hellas</title>
</svelte:head>

<BusinessForm
        mode="create"
        submitTo="?/save"
/>