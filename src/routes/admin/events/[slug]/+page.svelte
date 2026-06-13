<script lang="ts">
  import EventForm from '$lib/components/cms/EventForm.svelte';

  let {data} = $props();
</script>

<svelte:head>
  <title>Edit event | GV Hellas</title>
</svelte:head>

<EventForm
        mode="edit"
        submitTo="?/save"
        initialEvent={data.event}
/>