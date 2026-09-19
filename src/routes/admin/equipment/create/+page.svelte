<script lang="ts">
    import {t} from '$lib/i18n';
    import EquipmentForm from '$lib/components/cms/EquipmentForm.svelte';
</script>

<svelte:head>
    <title>{$t('admin.equipment.form.create')} | Griechischer Verein Hellas</title>
</svelte:head>

<EquipmentForm />
