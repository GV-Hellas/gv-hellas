<script lang="ts">
    import {onDestroy} from 'svelte';

    import {t, locale} from '$lib/i18n';
    import type {Lang, LinkPayload, StoredLink} from '$lib/cms/links/types';

    import LocalizedField from './LocalizedField.svelte';
    import LocalizedRichText from './LocalizedRichText.svelte';

    import {Button} from '$lib/components/ui/button/index.js';
    import {Input} from '$lib/components/ui/input/index.js';
    import {Label} from '$lib/components/ui/label/index.js';
    import {cn} from '$lib/utils.js';

    type LinkItem = Partial<StoredLink> & LinkPayload;

    type FormMode = 'create' | 'edit';

    type Props = {
        mode?: FormMode;
        submitTo?: string;
        initialItem?: LinkItem | null;
    };

    type SaveResponse = {
        ok?: boolean;
        id?: number;
        message?: string;
    };

    let {
        mode = 'create',
        submitTo = '?/save',
        initialItem = null
    }: Props = $props();

    const id = $props.id();

    let loading = $state(false);
    let error = $state('');
    let success = $state('');
    let fieldErrors = $state<Record<string, string>>({});
    let logoFile = $state<File | null>(null);
    let preview = $state('');
    let objectUrl = '';

    const controlClass =
        'h-10 rounded-xl border border-slate-300 bg-white shadow-sm focus-visible:border-primary focus-visible:ring-primary/25';

    const invalidControlClass =
        'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/25';

    function text(key: string, fallback: string) {
        const value = $t(key);
        return value === key ? fallback : value;
    }

    function emptyItem(): LinkItem {
        return {
            name: {
                el: '',
                de: ''
            },
            descriptionHtml: {
                el: '',
                de: ''
            },
            url: '',
            logo: '',
            logoVariants: {
                webp: '',
                jpg: ''
            }
        };
    }

    function normalizeItem(source: LinkItem | null): LinkItem {
        const item = structuredClone(source ?? emptyItem());

        return {
            ...item,
            name: {
                el: item.name?.el ?? '',
                de: item.name?.de ?? ''
            },
            descriptionHtml: {
                el: item.descriptionHtml?.el ?? '',
                de: item.descriptionHtml?.de ?? ''
            },
            url: item.url ?? '',
            logo: item.logo ?? '',
            logoVariants: {
                webp: item.logoVariants?.webp ?? '',
                jpg: item.logoVariants?.jpg ?? ''
            }
        };
    }

    function itemLogoSource(source: LinkItem) {
        return source.logo || source.logoVariants?.webp || source.logoVariants?.jpg || '';
    }

    function revokeObjectUrl() {
        if (!objectUrl) return;

        URL.revokeObjectURL(objectUrl);
        objectUrl = '';
    }

    let item = $state<LinkItem>(emptyItem());

    $effect(() => {
        const nextItem = normalizeItem(initialItem);

        revokeObjectUrl();

        item = nextItem;
        preview = itemLogoSource(nextItem);
        logoFile = null;
        fieldErrors = {};
        error = '';
        success = '';
    });

    const lang = $derived(($locale || 'el') as Lang);
    const languageSuffix = $derived(lang.toUpperCase());

    onDestroy(() => {
        revokeObjectUrl();
    });

    function localizedLabel(label: string) {
        return `${label} - ${languageSuffix}`;
    }

    function issueMessage(path: string) {
        if (path === 'name.el') {
            return text('admin.links.form.validationNameEl', 'Greek title is required.');
        }

        if (path === 'url') {
            return text('admin.links.form.validationUrl', 'A valid URL is required.');
        }

        return text('admin.form.validationFailed', 'Please check the form fields.');
    }

    function isValidUrl(value: string) {
        try {
            const parsed = new URL(value);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
            return false;
        }
    }

    function getPayloadForValidation(): LinkPayload {
        return {
            name: {
                el: item.name.el.trim(),
                de: item.name.de.trim()
            },
            descriptionHtml: {
                el: item.descriptionHtml.el,
                de: item.descriptionHtml.de
            },
            url: item.url.trim(),
            logo: item.logo ?? '',
            logoVariants: {
                webp: item.logoVariants?.webp ?? '',
                jpg: item.logoVariants?.jpg ?? ''
            }
        };
    }

    function validatePayload(payload: LinkPayload) {
        const errors: Record<string, string> = {};

        if (!payload.name.el.trim()) {
            errors['name.el'] = issueMessage('name.el');
        }

        if (!payload.url.trim() || !isValidUrl(payload.url.trim())) {
            errors.url = issueMessage('url');
        }

        return errors;
    }

    function validateField(path: string) {
        if (!fieldErrors[path]) return;

        const payload = getPayloadForValidation();
        const nextErrors = {...fieldErrors};
        const validationErrors = validatePayload(payload);

        if (validationErrors[path]) {
            nextErrors[path] = validationErrors[path];
        } else {
            delete nextErrors[path];
        }

        fieldErrors = nextErrors;
    }

    function validateClient() {
        const payload = getPayloadForValidation();
        const validationErrors = validatePayload(payload);

        if (Object.keys(validationErrors).length > 0) {
            fieldErrors = validationErrors;
            error = text('admin.form.validationFailed', 'Please check the form fields.');
            return null;
        }

        fieldErrors = {};
        return payload;
    }

    function onFileChange(event: Event) {
        const input = event.currentTarget as HTMLInputElement;
        const file = input.files?.[0] ?? null;

        revokeObjectUrl();

        logoFile = file;

        if (!file) {
            preview = itemLogoSource(item);
            return;
        }

        objectUrl = URL.createObjectURL(file);
        preview = objectUrl;
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

        formData.append('name_el', payload.name.el);
        formData.append('name_de', payload.name.de);
        formData.append('description_html_el', payload.descriptionHtml.el);
        formData.append('description_html_de', payload.descriptionHtml.de);
        formData.append('url', payload.url);

        if (logoFile) {
            formData.append('logo', logoFile);
        }

        try {
            const response = await fetch(submitTo, {
                method: 'POST',
                body: formData
            });

            if (response.redirected) {
                window.location.href = response.url;
                return;
            }

            const contentType = response.headers.get('content-type') || '';
            const result = contentType.includes('application/json')
                ? ((await response.json()) as SaveResponse)
                : ({ok: response.ok} satisfies SaveResponse);

            if (!response.ok || !result.ok) {
                error = result.message || text('admin.links.form.couldNotSave', 'The link could not be saved.');
                return;
            }

            success = result.id
                ? `${text('admin.links.form.saved', 'Saved')}: ${result.id}`
                : text('admin.links.form.saved', 'Saved');
        } catch {
            error = text('admin.links.form.couldNotSave', 'The link could not be saved.');
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
                    ? $t('admin.links.form.editTitle')
                    : $t('admin.links.form.createTitle')}
            </h1>

            <p>
                {$t('admin.links.form.subtitle')}
            </p>
        </div>

        <div class="lang-indicator" aria-label="Current language">
            {lang.toUpperCase()}
        </div>
    </div>

    <div class="card">
        <LocalizedField
                label={$t('admin.links.table.title')}
                bind:value={item.name}
                {lang}
                required={lang === 'el'}
                error={fieldErrors[`name.${lang}`] || fieldErrors['name.el']}
                placeholder={
                lang === 'de'
                    ? $t('admin.links.form.nameDePlaceholder')
                    : $t('admin.links.form.nameElPlaceholder')
            }
                onValueChange={() => validateField(`name.${lang}`)}
        />

        <LocalizedRichText
                label={localizedLabel($t('admin.links.form.descriptionHtml'))}
                bind:value={item.descriptionHtml}
                {lang}
        />

        <div class="field">
            <Label for={`${id}-url`} class="px-1">
                {$t('admin.links.form.url')}
            </Label>

            <Input
                    id={`${id}-url`}
                    name="url"
                    type="url"
                    bind:value={item.url}
                    required
                    aria-invalid={!!fieldErrors.url}
                    class={cn(controlClass, fieldErrors.url && invalidControlClass)}
                    placeholder="https://..."
                    oninput={() => validateField('url')}
            />

            {#if fieldErrors.url}
                <p class="field-error">
                    {fieldErrors.url}
                </p>
            {/if}
        </div>

        <div class="field">
            <Label for={`${id}-logo`} class="px-1">
                {$t('admin.links.form.logoUpload')}
            </Label>

            <Input
                    id={`${id}-logo`}
                    name="logo"
                    type="file"
                    accept="image/*"
                    class="h-10 rounded-xl border border-slate-300 bg-white shadow-sm file:mr-4 file:border-0 file:bg-transparent file:text-sm file:font-medium"
                    onchange={onFileChange}
            />

            {#if preview}
                <div class="logo-preview">
                    <img
                            src={preview}
                            alt={$t('admin.links.form.logoPreview')}
                    />

                    <div>
                        {mode === 'edit'
                            ? $t('admin.links.form.currentLogoHint')
                            : $t('admin.links.form.logoPreview')}
                    </div>
                </div>
            {/if}
        </div>
    </div>

    {#if error}
        <p class="error">
            {error}
        </p>
    {/if}

    {#if success}
        <p class="success">
            {success}
        </p>
    {/if}

    <div class="flex justify-end gap-2 pt-2">
        <a
                href="/admin/links"
                class="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium shadow-sm hover:bg-slate-50"
        >
            {$t('common.cancel')}
        </a>

        <Button type="submit" disabled={loading} class="rounded-xl">
            {#if loading}
                {$t('admin.form.saving')}
            {:else if mode === 'edit'}
                {$t('admin.links.form.saveButton')}
            {:else}
                {$t('admin.links.form.createButton')}
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

    .card {
        display: grid;
        gap: 1rem;
        border: 1px solid #eaecf0;
        border-radius: 1rem;
        background: #fff;
        padding: 1rem;
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: .5rem;
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
        .topbar {
            display: grid;
            grid-template-columns: 1fr;
        }
    }
</style>