<script lang="ts">
    import {onDestroy} from 'svelte';

    import {t, locale} from '$lib/i18n';
    import type {
        BusinessMedia,
        BusinessPayload,
        BusinessSection,
        Lang,
        StoredBusiness
    } from '$lib/cms/business/types';

    import {
        BUSINESS_SPONSOR_DESCRIPTION_KEYS,
        BUSINESS_SPONSOR_LABEL_KEYS,
        BUSINESS_SPONSOR_TYPES
    } from '$lib/cms/business/schema';

    import {businessPayloadSchema} from '$lib/cms/business/validation';

    import LocalizedField from './LocalizedField.svelte';
    import BusinessSectionEditor from './BusinessSection.svelte';

    import {Button} from '$lib/components/ui/button/index.js';
    import {Input} from '$lib/components/ui/input/index.js';
    import {Label} from '$lib/components/ui/label/index.js';
    import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
    import {cn} from '$lib/utils.js';

    import type {ZodIssue} from 'zod';

    type FormMode = 'create' | 'edit';

    type Props = {
        mode?: FormMode;
        submitTo?: string;
        initialBusiness?: StoredBusiness | BusinessPayload | null;
    };

    type SaveResponse = {
        ok?: boolean;
        id?: number;
        slug?: string;
        message?: string;
    };

    let {
        mode = 'create',
        submitTo = '?/save',
        initialBusiness = null
    }: Props = $props();

    const id = $props.id();

    let loading = $state(false);
    let error = $state('');
    let success = $state('');
    let fieldErrors = $state<Record<string, string>>({});
    let logoFile = $state<File | null>(null);
    let logoPreview = $state('');
    let logoObjectUrl = '';

    const files = new Map<string, File>();

    const controlClass =
        'h-10 rounded-xl border border-slate-300 bg-white shadow-sm focus-visible:border-primary focus-visible:ring-primary/25';

    const invalidControlClass =
        'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/25';

    function newSection(): BusinessSection {
        return {
            id: crypto.randomUUID(),
            beforeHtml: {el: '', de: ''},
            media: [],
            afterHtml: {el: '', de: ''}
        };
    }

    function emptyBusiness(): BusinessPayload {
        return {
            sponsorType: 'listed',
            name: '',
            slug: '',
            logo: '',
            description: {el: '', de: ''},
            url: '',
            email: '',
            telephone: '',
            contactPerson: '',
            sections: [newSection()]
        };
    }

    function normalizeBusiness(source: StoredBusiness | BusinessPayload | null): BusinessPayload {
        const next = structuredClone(source ?? emptyBusiness());

        return {
            sponsorType: next.sponsorType ?? 'listed',
            name: next.name ?? '',
            slug: '',
            logo: next.logo ?? '',
            description: {
                el: next.description?.el ?? '',
                de: next.description?.de ?? ''
            },
            url: next.url ?? '',
            email: next.email ?? '',
            telephone: next.telephone ?? '',
            contactPerson: next.contactPerson ?? '',
            sections: next.sections?.length ? next.sections : [newSection()]
        };
    }

    function revokeLogoObjectUrl() {
        if (!logoObjectUrl) return;

        URL.revokeObjectURL(logoObjectUrl);
        logoObjectUrl = '';
    }

    function businessLogoSource(source: BusinessPayload) {
        return source.logo ?? '';
    }

    let business = $state<BusinessPayload>(emptyBusiness());

    $effect(() => {
        const nextBusiness = normalizeBusiness(initialBusiness);

        revokeLogoObjectUrl();

        business = nextBusiness;
        logoPreview = businessLogoSource(nextBusiness);
        logoFile = null;
        fieldErrors = {};
        error = '';
        success = '';
        files.clear();
    });

    const lang = $derived(($locale || 'el') as Lang);

    onDestroy(() => {
        revokeLogoObjectUrl();
    });

    function issuePath(issue: ZodIssue) {
        return issue.path.join('.');
    }

    function mapIssues(issues: ZodIssue[]) {
        return issues.reduce<Record<string, string>>((acc, issue) => {
            const path = issuePath(issue);

            if (!acc[path]) {
                acc[path] = issue.message;
            }

            return acc;
        }, {});
    }

    function getIssueForPath(path: string, issues: ZodIssue[]) {
        return issues.find((issue) => issuePath(issue) === path);
    }

    function getPayloadForValidation(): BusinessPayload {
        return {
            ...business,
            name: business.name.trim(),
            slug: '',
            url: business.url.trim(),
            email: business.email.trim(),
            telephone: business.telephone.trim(),
            contactPerson: business.contactPerson.trim()
        };
    }

    function validateField(path: string) {
        if (!fieldErrors[path]) return;

        const payload = getPayloadForValidation();
        const result = businessPayloadSchema.safeParse(payload);
        const nextErrors = {...fieldErrors};

        if (result.success) {
            delete nextErrors[path];
            fieldErrors = nextErrors;
            return;
        }

        const issue = getIssueForPath(path, result.error.issues);

        if (issue) {
            nextErrors[path] = issue.message;
        } else {
            delete nextErrors[path];
        }

        fieldErrors = nextErrors;
    }

    function validateClient() {
        const payload = getPayloadForValidation();
        const result = businessPayloadSchema.safeParse(payload);

        if (!result.success) {
            fieldErrors = mapIssues(result.error.issues);
            error = $t('admin.form.validationFailed');
            return null;
        }

        fieldErrors = {};
        return result.data;
    }

    function addSection() {
        business.sections = [...business.sections, newSection()];
    }

    function removeSection(id: string) {
        if (business.sections.length === 1) return;

        business.sections = business.sections.filter((section) => section.id !== id);
    }

    function rememberFile(item: { media: BusinessMedia; file: File }) {
        if (!item.media.uploadKey) return;

        files.set(item.media.uploadKey, item.file);
    }

    function onLogoChange(event: Event) {
        const input = event.currentTarget as HTMLInputElement;
        const file = input.files?.[0] ?? null;

        revokeLogoObjectUrl();

        logoFile = file;

        if (!file) {
            logoPreview = businessLogoSource(business);
            return;
        }

        logoObjectUrl = URL.createObjectURL(file);
        logoPreview = logoObjectUrl;
    }

    async function submit() {
        loading = true;
        error = '';
        success = '';

        const payload = validateClient();

        if (!payload) {
            loading = false;
            return;
        }

        const formData = new FormData();

        formData.append('payload', JSON.stringify(payload));

        if (logoFile) {
            formData.append('logo', logoFile);
        }

        for (const [key, file] of files.entries()) {
            formData.append(key, file);
        }

        try {
            const response = await fetch(submitTo, {
                method: 'POST',
                body: formData
            });

            const result = (await response.json()) as SaveResponse;

            if (!response.ok || !result.ok) {
                error = result.message || $t('admin.form.couldNotSave');
                return;
            }

            success = `${$t('admin.form.saved')}: ${result.slug || result.id}`;
        } catch {
            error = $t('admin.form.couldNotSave');
        } finally {
            loading = false;
        }
    }
</script>

<form
        class="form"
        novalidate
        onsubmit={(submitEvent) => {
        submitEvent.preventDefault();
        submit();
    }}
>
    <div class="topbar">
        <div>
            <h1 class="text-xl font-bold">
                {mode === 'edit'
                    ? $t('admin.businesses.form.editBusiness')
                    : $t('admin.businesses.form.createBusiness')}
            </h1>

            <p>
                {$t('admin.businesses.form.subtitle')}
            </p>
        </div>

        <div class="lang-indicator" aria-label="Current language">
            {lang.toUpperCase()}
        </div>
    </div>

    <div class="card">
        <div class="field">
            <Label for={`${id}-name`} class="px-1">
                {$t('admin.businesses.form.name')}
            </Label>

            <Input
                    id={`${id}-name`}
                    bind:value={business.name}
                    required
                    aria-invalid={!!fieldErrors.name}
                    class={cn(controlClass, fieldErrors.name && invalidControlClass)}
                    oninput={() => validateField('name')}
            />

            {#if fieldErrors.name}
                <p class="field-error">{fieldErrors.name}</p>
            {/if}
        </div>

        <LocalizedField
                label={$t('admin.businesses.form.description')}
                bind:value={business.description}
                {lang}
                textarea
                error={fieldErrors[`description.${lang}`]}
                onValueChange={() => validateField(`description.${lang}`)}
        />

        <div class="grid">
            <div class="field">
                <Label for={`${id}-url`} class="px-1">
                    {$t('admin.businesses.form.url')}
                </Label>

                <Input
                        id={`${id}-url`}
                        type="url"
                        bind:value={business.url}
                        aria-invalid={!!fieldErrors.url}
                        class={cn(controlClass, fieldErrors.url && invalidControlClass)}
                        placeholder="https://..."
                        oninput={() => validateField('url')}
                />

                {#if fieldErrors.url}
                    <p class="field-error">{fieldErrors.url}</p>
                {/if}
            </div>

            <div class="field">
                <Label for={`${id}-email`} class="px-1">
                    {$t('admin.businesses.form.email')}
                </Label>

                <Input
                        id={`${id}-email`}
                        type="email"
                        bind:value={business.email}
                        aria-invalid={!!fieldErrors.email}
                        class={cn(controlClass, fieldErrors.email && invalidControlClass)}
                        oninput={() => validateField('email')}
                />

                {#if fieldErrors.email}
                    <p class="field-error">{fieldErrors.email}</p>
                {/if}
            </div>

            <div class="field">
                <Label for={`${id}-telephone`} class="px-1">
                    {$t('admin.businesses.form.telephone')}
                </Label>

                <Input
                        id={`${id}-telephone`}
                        bind:value={business.telephone}
                        class={controlClass}
                />
            </div>

            <div class="field">
                <Label for={`${id}-contact-person`} class="px-1">
                    {$t('admin.businesses.form.contactPerson')}
                </Label>

                <Input
                        id={`${id}-contact-person`}
                        bind:value={business.contactPerson}
                        class={controlClass}
                />
            </div>
        </div>

        <div class="field">
            <Label for={`${id}-logo`} class="px-1">
                {$t('admin.businesses.form.logo')}
            </Label>

            <Input
                    id={`${id}-logo`}
                    type="file"
                    accept="image/*"
                    class="h-10 rounded-xl border border-slate-300 bg-white shadow-sm file:mr-4 file:border-0 file:bg-transparent file:text-sm file:font-medium"
                    onchange={onLogoChange}
            />

            {#if logoPreview}
                <div class="logo-preview">
                    <img
                            src={logoPreview}
                            alt={$t('admin.businesses.form.logoPreview')}
                    />

                    <div>
                        {mode === 'edit'
                            ? $t('admin.businesses.form.currentLogoHint')
                            : $t('admin.businesses.form.logoPreview')}
                    </div>
                </div>
            {/if}
        </div>

        <div class="field">
            <Label class="px-1">
                {$t('admin.businesses.form.sponsorType')}
            </Label>

            <div class="sponsor-grid">
                <RadioGroup.Root
                        bind:value={business.sponsorType}
                        class="contents"
                >
                    {#each BUSINESS_SPONSOR_TYPES as type}
                        <label
                                class="sponsor-card"
                                class:active={business.sponsorType === type}
                                for={`${id}-sponsor-${type}`}
                        >
                            <RadioGroup.Item
                                    id={`${id}-sponsor-${type}`}
                                    value={type}
                                    class="mt-0.5 shrink-0"
                            />

                            <span class="min-w-0">
                    <strong>{$t(BUSINESS_SPONSOR_LABEL_KEYS[type])}</strong>
                    <small>{$t(BUSINESS_SPONSOR_DESCRIPTION_KEYS[type])}</small>
                </span>
                        </label>
                    {/each}
                </RadioGroup.Root>
            </div>
        </div>
    </div>

    <div class="sections">
        {#each business.sections as _, index (business.sections[index].id)}
            <BusinessSectionEditor
                    bind:section={business.sections[index]}
                    {index}
                    {lang}
                    onFiles={rememberFile}
                    onRemove={() => removeSection(business.sections[index].id)}
            />
        {/each}
    </div>

    <Button
            type="button"
            variant="secondary"
            class="justify-self-start rounded-xl border border-slate-300 shadow-sm"
            onclick={addSection}
    >
        + {$t('admin.businesses.form.addSection')}
    </Button>

    {#if error}
        <p class="error">{error}</p>
    {/if}

    {#if success}
        <p class="success">{success}</p>
    {/if}

    <div class="flex justify-end gap-2 pt-2">
        <a
                href="/admin/businesses"
                class="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium shadow-sm hover:bg-slate-50"
        >
            {$t('common.cancel')}
        </a>

        <Button type="submit" disabled={loading} class="rounded-xl">
            {#if loading}
                {$t('admin.form.saving')}
            {:else if mode === 'edit'}
                {$t('admin.businesses.form.saveChanges')}
            {:else}
                {$t('admin.businesses.form.saveBusiness')}
            {/if}
        </Button>
    </div>
</form>

<style>
    .form {
        max-width: 980px;
        margin: 0 auto;
        display: grid;
        gap: 1rem;
    }

    .topbar {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: start;
    }

    h1 {
        margin: 0;
    }

    p {
        margin: .25rem 0 0;
        color: #667085;
    }

    .lang-indicator {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 3rem;
        border-radius: .8rem;
        background: #f2f4f7;
        padding: .5rem .75rem;
        font-weight: 800;
        color: #004680;
    }

    .card,
    .sections {
        display: grid;
        gap: 1rem;
    }

    .card {
        border: 1px solid #eaecf0;
        border-radius: 1rem;
        background: #fff;
        padding: 1rem;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: .5rem;
    }

    .sponsor-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: .75rem;
        width: 100%;
    }

    .sponsor-card {
        min-width: 0;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: flex-start;
        gap: .6rem;
        border: 1px solid #d0d5dd;
        border-radius: .9rem;
        background: #fff;
        padding: .85rem;
        cursor: pointer;
        transition:
                border-color .15s ease,
                box-shadow .15s ease,
                background .15s ease;
    }

    .sponsor-card.active {
        border-color: hsl(var(--primary));
        background: hsl(var(--primary) / .05);
        box-shadow: 0 0 0 3px hsl(var(--primary) / .12);
    }

    .sponsor-card strong {
        display: block;
        min-width: 0;
        font-size: .875rem;
        line-height: 1.2;
    }

    .sponsor-card small {
        display: block;
        min-width: 0;
        margin-top: .2rem;
        color: #667085;
        font-size: .75rem;
        line-height: 1.3;
    }

    @media (max-width: 900px) {
        .sponsor-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
    }

    @media (max-width: 560px) {
        .sponsor-grid {
            grid-template-columns: 1fr;
        }
    }

    .field-error,
    .error {
        margin: 0;
        color: hsl(var(--destructive));
    }

    .field-error {
        font-size: 0.8125rem;
        line-height: 1.25rem;
    }

    .success {
        margin: 0;
        color: #027a48;
    }

    .logo-preview {
        display: flex;
        align-items: center;
        gap: 1rem;
        border: 1px solid #e2e8f0;
        border-radius: .75rem;
        background: #f8fafc;
        padding: .75rem;
        color: #667085;
        font-size: .875rem;
    }

    .logo-preview img {
        width: 4rem;
        height: 4rem;
        border: 1px solid #e2e8f0;
        border-radius: .75rem;
        background: white;
        object-fit: cover;
    }

    @media (max-width: 720px) {
        .topbar,
        .grid {
            grid-template-columns: 1fr;
            display: grid;
        }
    }
</style>