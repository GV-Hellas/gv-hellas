<script lang="ts">
    import {t, locale} from '$lib/i18n';

    import {Button} from '$lib/components/ui/button/index.js';
    import {Input} from '$lib/components/ui/input/index.js';
    import {Textarea} from '$lib/components/ui/textarea/index.js';
    import {Label} from '$lib/components/ui/label/index.js';
    import * as Card from '$lib/components/ui/card/index.js';

    import {cn} from '$lib/utils.js';

    type UiLang = 'el' | 'de';
    type ContactField = 'name' | 'email' | 'phone' | 'message';

    type ContactPayload = {
        name: string;
        email: string;
        phone: string;
        message: string;
        website: string;
    };

    const id = $props.id();

    const fallbackText: Record<UiLang, Record<string, string>> = {
        el: {
            'contact.successMessage': 'Σας ευχαριστούμε. Το μήνυμά σας στάλθηκε με επιτυχία.',
            'contact.errorMessage': 'Το μήνυμα δεν μπόρεσε να σταλεί. Παρακαλώ δοκιμάστε ξανά αργότερα.',
            'contact.sending': 'Αποστολή…',

            'contact.validation.form': 'Παρακαλώ ελέγξτε τα πεδία που έχουν επισημανθεί.',
            'contact.validation.name': 'Παρακαλώ συμπληρώστε το όνομά σας.',
            'contact.validation.nameLong': 'Το όνομα είναι πολύ μεγάλο.',
            'contact.validation.email': 'Παρακαλώ συμπληρώστε μια έγκυρη διεύθυνση email.',
            'contact.validation.emailLong': 'Η διεύθυνση email είναι πολύ μεγάλη.',
            'contact.validation.phone': 'Παρακαλώ συμπληρώστε έναν έγκυρο αριθμό τηλεφώνου.',
            'contact.validation.phoneLong': 'Ο αριθμός τηλεφώνου είναι πολύ μεγάλος.',
            'contact.validation.message': 'Παρακαλώ γράψτε ένα μήνυμα με τουλάχιστον 10 χαρακτήρες.',
            'contact.validation.messageLong': 'Το μήνυμα είναι πολύ μεγάλο.',
            'contact.validation.rateLimit': 'Στάλθηκαν πολλά μηνύματα. Παρακαλώ δοκιμάστε ξανά αργότερα.',

            'contact.mapTitle': 'Χάρτης',
            'contact.mapDescription': 'Δείτε την περιοχή του συλλόγου στο OpenStreetMap.',
            'contact.openInMaps': 'Άνοιγμα στο OpenStreetMap'
        },
        de: {
            'contact.successMessage': 'Vielen Dank. Ihre Nachricht wurde erfolgreich gesendet.',
            'contact.errorMessage': 'Die Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.',
            'contact.sending': 'Senden…',

            'contact.validation.form': 'Bitte überprüfen Sie die markierten Felder.',
            'contact.validation.name': 'Bitte geben Sie Ihren Namen ein.',
            'contact.validation.nameLong': 'Der Name ist zu lang.',
            'contact.validation.email': 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
            'contact.validation.emailLong': 'Die E-Mail-Adresse ist zu lang.',
            'contact.validation.phone': 'Bitte geben Sie eine gültige Telefonnummer ein.',
            'contact.validation.phoneLong': 'Die Telefonnummer ist zu lang.',
            'contact.validation.message': 'Bitte geben Sie eine Nachricht mit mindestens 10 Zeichen ein.',
            'contact.validation.messageLong': 'Die Nachricht ist zu lang.',
            'contact.validation.rateLimit': 'Zu viele Nachrichten. Bitte versuchen Sie es später erneut.',

            'contact.mapTitle': 'Karte',
            'contact.mapDescription': 'Sehen Sie die Umgebung des Vereins auf OpenStreetMap.',
            'contact.openInMaps': 'In OpenStreetMap öffnen'
        }
    };

    const contactFields: ContactField[] = ['name', 'email', 'phone', 'message'];

    const mapQuery = '4852 Rothrist, Switzerland';
    const mapUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(mapQuery)}`;
    const mapEmbedUrl =
        'https://www.openstreetmap.org/export/embed.html?bbox=7.84%2C47.28%2C7.94%2C47.34&layer=mapnik';

    let name = $state('');
    let email = $state('');
    let phone = $state('');
    let message = $state('');
    let website = $state('');

    let loading = $state(false);
    let submitted = $state(false);
    let formError = $state('');
    let fieldErrors = $state<Partial<Record<ContactField, string>>>({});

    const lang = $derived(($locale === 'de' ? 'de' : 'el') as UiLang);

    const inputClass =
        'h-10 rounded-xl border border-slate-300 bg-white shadow-sm focus-visible:border-primary focus-visible:ring-primary/25';

    const textareaClass =
        'min-h-32 rounded-xl border border-slate-300 bg-white shadow-sm focus-visible:border-primary focus-visible:ring-primary/25';

    const invalidClass =
        'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/25';

    function text(key: string) {
        const value = $t(key);

        if (value && value !== key) {
            return value;
        }

        return fallbackText[lang][key] ?? key;
    }

    function payload(): ContactPayload {
        return {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            message: message.trim(),
            website: website.trim()
        };
    }

    function validateContactField(field: ContactField, value: string) {
        const trimmedValue = value.trim();

        if (field === 'name') {
            if (trimmedValue.length < 2) {
                return text('contact.validation.name');
            }

            if (trimmedValue.length > 120) {
                return text('contact.validation.nameLong');
            }
        }

        if (field === 'email') {
            const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue);

            if (!validEmail) {
                return text('contact.validation.email');
            }

            if (trimmedValue.length > 254) {
                return text('contact.validation.emailLong');
            }
        }

        if (field === 'phone') {
            if (trimmedValue && trimmedValue.length < 6) {
                return text('contact.validation.phone');
            }

            if (trimmedValue.length > 50) {
                return text('contact.validation.phoneLong');
            }
        }

        if (field === 'message') {
            if (trimmedValue.length < 10) {
                return text('contact.validation.message');
            }

            if (trimmedValue.length > 5000) {
                return text('contact.validation.messageLong');
            }
        }

        return '';
    }

    function validateForm() {
        const data = payload();
        const nextErrors: Partial<Record<ContactField, string>> = {};

        for (const field of contactFields) {
            const error = validateContactField(field, data[field]);

            if (error) {
                nextErrors[field] = error;
            }
        }

        fieldErrors = nextErrors;

        return Object.keys(nextErrors).length === 0;
    }

    function validateField(field: ContactField) {
        if (!fieldErrors[field]) return;

        const data = payload();
        const nextError = validateContactField(field, data[field]);
        const nextErrors = {...fieldErrors};

        if (nextError) {
            nextErrors[field] = nextError;
        } else {
            delete nextErrors[field];
        }

        fieldErrors = nextErrors;
    }

    function handleInput(field: ContactField) {
        queueMicrotask(() => {
            validateField(field);
        });
    }

    function translateServerFieldErrors(errors: unknown) {
        if (!errors || typeof errors !== 'object') {
            return {};
        }

        const data = payload();
        const rawErrors = errors as Record<string, unknown>;
        const nextErrors: Partial<Record<ContactField, string>> = {};

        for (const field of contactFields) {
            if (!rawErrors[field]) continue;

            nextErrors[field] =
                validateContactField(field, data[field]) ||
                String(rawErrors[field]) ||
                text('contact.validation.form');
        }

        return nextErrors;
    }

    function resetForm() {
        name = '';
        email = '';
        phone = '';
        message = '';
        website = '';
        fieldErrors = {};
    }

    async function handleSubmit(event: SubmitEvent) {
        event.preventDefault();

        formError = '';
        submitted = false;

        if (!validateForm()) {
            formError = text('contact.validation.form');
            return;
        }

        const data = payload();

        // Honeypot: bots often fill hidden fields. Pretend success, but do not send.
        if (data.website) {
            submitted = true;
            resetForm();
            return;
        }

        loading = true;

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json().catch(() => null);

            if (!response.ok || !result?.ok) {
                const serverErrors = translateServerFieldErrors(result?.fieldErrors);

                if (Object.keys(serverErrors).length > 0) {
                    fieldErrors = serverErrors;
                    formError = text('contact.validation.form');
                    return;
                }

                formError =
                    response.status === 429
                        ? text('contact.validation.rateLimit')
                        : text('contact.errorMessage');

                return;
            }

            submitted = true;
            resetForm();
        } catch {
            formError = text('contact.errorMessage');
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>{$t('contact.headline')} | GV Hellas</title>
</svelte:head>

<section class="grid gap-8 pb-10">
    <div class="max-w-3xl">
        <h1 class="text-3xl font-bold tracking-tight">
            {$t('contact.headline')}
        </h1>

        <p class="mt-3 text-slate-600">
            {$t('contact.formHeadline')}
        </p>
    </div>

    <div class="grid gap-8 md:grid-cols-[1.15fr_0.85fr]">
        <Card.Root class="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Card.Header>
                <Card.Title>
                    {$t('contact.formHeadline')}
                </Card.Title>
            </Card.Header>

            <Card.Content>
                {#if submitted}
                    <div
                            class="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
                            role="alert"
                    >
                        {text('contact.successMessage')}
                    </div>
                {:else}
                    <form class="grid gap-4" novalidate onsubmit={handleSubmit}>
                        <div class="honeypot" aria-hidden="true">
                            <Label for={`${id}-website`}>Website</Label>
                            <Input
                                    id={`${id}-website`}
                                    tabindex={-1}
                                    autocomplete="off"
                                    bind:value={website}
                            />
                        </div>

                        <div class="field">
                            <Label for={`${id}-name`} class="px-1">
                                {$t('contact.name')}
                            </Label>

                            <Input
                                    id={`${id}-name`}
                                    type="text"
                                    autocomplete="name"
                                    bind:value={name}
                                    aria-invalid={!!fieldErrors.name}
                                    aria-describedby={fieldErrors.name ? `${id}-name-error` : undefined}
                                    class={cn(inputClass, fieldErrors.name && invalidClass)}
                                    oninput={() => handleInput('name')}
                            />

                            {#if fieldErrors.name}
                                <p id={`${id}-name-error`} class="field-error">
                                    {fieldErrors.name}
                                </p>
                            {/if}
                        </div>

                        <div class="field">
                            <Label for={`${id}-email`} class="px-1">
                                {$t('contact.email')}
                            </Label>

                            <Input
                                    id={`${id}-email`}
                                    type="email"
                                    autocomplete="email"
                                    bind:value={email}
                                    aria-invalid={!!fieldErrors.email}
                                    aria-describedby={fieldErrors.email ? `${id}-email-error` : undefined}
                                    class={cn(inputClass, fieldErrors.email && invalidClass)}
                                    oninput={() => handleInput('email')}
                            />

                            {#if fieldErrors.email}
                                <p id={`${id}-email-error`} class="field-error">
                                    {fieldErrors.email}
                                </p>
                            {/if}
                        </div>

                        <div class="field">
                            <Label for={`${id}-phone`} class="px-1">
                                {$t('contact.phone')}
                            </Label>

                            <Input
                                    id={`${id}-phone`}
                                    type="tel"
                                    autocomplete="tel"
                                    bind:value={phone}
                                    aria-invalid={!!fieldErrors.phone}
                                    aria-describedby={fieldErrors.phone ? `${id}-phone-error` : undefined}
                                    class={cn(inputClass, fieldErrors.phone && invalidClass)}
                                    oninput={() => handleInput('phone')}
                            />

                            {#if fieldErrors.phone}
                                <p id={`${id}-phone-error`} class="field-error">
                                    {fieldErrors.phone}
                                </p>
                            {/if}
                        </div>

                        <div class="field">
                            <Label for={`${id}-message`} class="px-1">
                                {$t('contact.message')}
                            </Label>

                            <Textarea
                                    id={`${id}-message`}
                                    rows={5}
                                    bind:value={message}
                                    aria-invalid={!!fieldErrors.message}
                                    aria-describedby={fieldErrors.message ? `${id}-message-error` : undefined}
                                    class={cn(textareaClass, fieldErrors.message && invalidClass)}
                                    oninput={() => handleInput('message')}
                            />

                            {#if fieldErrors.message}
                                <p id={`${id}-message-error`} class="field-error">
                                    {fieldErrors.message}
                                </p>
                            {/if}
                        </div>

                        {#if formError}
                            <p class="form-error" role="alert">
                                {formError}
                            </p>
                        {/if}

                        <div class="flex justify-end">
                            <Button type="submit" disabled={loading} class="rounded-xl">
                                {loading ? text('contact.sending') : $t('contact.send')}
                            </Button>
                        </div>
                    </form>
                {/if}
            </Card.Content>
        </Card.Root>

        <Card.Root class="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Card.Header>
                <Card.Title>
                    {$t('contact.address')}
                </Card.Title>
            </Card.Header>

            <Card.Content class="grid gap-6 text-sm text-slate-700">
                <div>
                    <h2 class="font-semibold text-slate-950">
                        {$t('contact.address')}
                    </h2>

                    <p class="mt-1">
                        4852 Rothrist, Suisse
                    </p>
                </div>

                <div>
                    <h2 class="font-semibold text-slate-950">
                        {$t('contact.phoneContact')}
                    </h2>

                    <p class="mt-1">
                        <a href="tel:+41787296030" class="link">
                            +41 (0)78 729 60 30
                        </a>
                    </p>
                </div>

                <div>
                    <h2 class="font-semibold text-slate-950">
                        Email
                    </h2>

                    <p class="mt-1">
                        <a href="mailto:info@gv-hellas.ch" class="link">
                            info@gv-hellas.ch
                        </a>
                    </p>
                </div>

                <div>
                    <h2 class="font-semibold text-slate-950">
                        {$t('contact.followUs')}
                    </h2>

                    <ul class="mt-2 grid gap-2">
                        <li>
                            <a href="https://www.facebook.com" target="_blank" rel="noopener" class="link">
                                Facebook
                            </a>
                        </li>

                        <li>
                            <a href="https://www.instagram.com" target="_blank" rel="noopener" class="link">
                                Instagram
                            </a>
                        </li>

                        <li>
                            <a href="https://www.tiktok.com" target="_blank" rel="noopener" class="link">
                                TikTok
                            </a>
                        </li>
                    </ul>
                </div>
            </Card.Content>
        </Card.Root>
    </div>

    <div class="full-width-map">
        <iframe
                title="OpenStreetMap - 4852 Rothrist"
                src={mapEmbedUrl}
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
        ></iframe>

        <a href={mapUrl} target="_blank" rel="noopener" class="map-link">
            {text('contact.openInMaps')}
        </a>
    </div>
</section>

<style>
    .field {
        display: grid;
        gap: .45rem;
    }

    .field-error,
    .form-error {
        margin: 0;
        color: hsl(var(--destructive));
        font-size: 0.8125rem;
        line-height: 1.25rem;
    }

    .form-error {
        border: 1px solid hsl(var(--destructive) / 0.25);
        border-radius: .75rem;
        background: hsl(var(--destructive) / 0.08);
        padding: .75rem .9rem;
    }

    .link {
        color: hsl(var(--primary));
        text-decoration: underline;
        text-underline-offset: 3px;
        transition: color 140ms ease;
    }

    .link:hover {
        color: hsl(var(--primary) / 0.8);
    }

    .honeypot {
        position: absolute;
        left: -9999px;
        width: 1px;
        height: 1px;
        overflow: hidden;
    }

    .full-width-map {
        width: 100vw;
        margin: 3rem calc(50% - 50vw) -4.5rem;
        position: relative;
        overflow: hidden;
        background: #e2e8f0;
        border-top: 1px solid #cbd5e1;
    }

    .full-width-map iframe {
        display: block;
        width: 100%;
        height: clamp(22rem, 42vw, 34rem);
        border: 0;
    }

    .map-link {
        position: absolute;
        right: 1rem;
        bottom: 1rem;
        border-radius: 999px;
        background: white;
        padding: .6rem .9rem;
        color: hsl(var(--primary));
        font-size: .875rem;
        font-weight: 700;
        box-shadow: 0 12px 28px rgba(15, 23, 42, .18);
        text-decoration: none;
    }

    .map-link:hover {
        color: hsl(var(--primary) / 0.8);
    }
</style>