<script lang="ts">
    import {t} from '$lib/i18n';
    import BusinessForm from '$lib/components/cms/BusinessForm.svelte';
</script>

<svelte:head>
    <title>{$t('admin.businesses.form.createBusiness')} | Griechischer Verein Hellas</title>
</svelte:head>

<BusinessForm
    mode="create"
    submitTo="?/save"
/>
