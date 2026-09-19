<script lang="ts">
    import {t} from '$lib/i18n';
    import EquipmentForm from '$lib/components/cms/EquipmentForm.svelte';
    import type {EquipmentPayload} from '$lib/cms/equipment/types';

    let {data}: {data: {item: EquipmentPayload}} = $props();
</script>

<svelte:head>
    <title>{$t('admin.equipment.form.edit')} | Griechischer Verein Hellas</title>
</svelte:head>

<EquipmentForm mode="edit" submitTo="?/save" initialEquipment={data.item} />
