<script lang="ts">
    import {env} from '$env/dynamic/public';
    import {t, locale} from '$lib/i18n';
    import {trackAnalyticsEvent} from '$lib/analytics';
    import Seo from '$lib/components/Seo.svelte';
    import Turnstile from '$lib/components/Turnstile.svelte';

    import {Button} from '$lib/components/ui/button/index.js';
    import {Input} from '$lib/components/ui/input/index.js';
    import {Textarea} from '$lib/components/ui/textarea/index.js';
    import {Label} from '$lib/components/ui/label/index.js';
    import * as Card from '$lib/components/ui/card/index.js';

    import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
    import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
    import Loader2Icon from '@lucide/svelte/icons/loader-2';
    import MailIcon from '@lucide/svelte/icons/mail';
    import MapPinIcon from '@lucide/svelte/icons/map-pin';
    import PhoneIcon from '@lucide/svelte/icons/phone';
    import SendIcon from '@lucide/svelte/icons/send';
    import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
    import UserRoundIcon from '@lucide/svelte/icons/user-round';

    import {cn} from '$lib/utils.js';

    type UiLang = 'el' | 'de';
    type ContactField = 'name' | 'email' | 'phone' | 'message';

    type ContactPayload = {
        name: string;
        email: string;
        phone: string;
        message: string;
        website: string;
        turnstileToken: string;
    };

    const id = $props.id();

    const TURNSTILE_SITE_KEY = '0x4AAAAAAE89AxpjSZqxEP-s';

    const socials = [
        {name: 'Facebook', href: 'https://www.facebook.com/p/Griechischer-Verein-Hellas-100089940210614/', icon: 'M22 12a10 10 0 1 0-11.56 9.87v-6.98h-2.1V12h2.1V9.8c0-2.08 1.24-3.23 3.14-3.23.9 0 1.84.16 1.84.16v2.03h-1.04c-1.02 0-1.34.64-1.34 1.29V12h2.28l-.36 2.9h-1.92v6.98A10 10 0 0 0 22 12Z'},
        {name: 'Instagram', href: 'https://www.instagram.com/griechischerverein/', icon: 'M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2Zm0 7.9A3.1 3.1 0 1 1 12 8.9a3.1 3.1 0 0 1 0 6.2Zm6.12-8.1a1.12 1.12 0 1 1-2.24 0 1.12 1.12 0 0 1 2.24 0ZM21.3 8.1c-.05-1.05-.29-1.99-1.06-2.75-.76-.76-1.7-1-2.75-1.06C16.42 4.25 16.08 4.2 12 4.2s-4.42.05-5.49.1c-1.05.06-1.99.3-2.75 1.06-.77.76-1 1.7-1.06 2.75-.05 1.07-.1 1.41-.1 5.49s.05 4.42.1 5.49c.06 1.05.29 1.99 1.06 2.75.76.76 1.7 1 2.75 1.06 1.07.05 1.41.1 5.49.1s4.42-.05 5.49-.1c1.05-.06 1.99-.3 2.75-1.06.77-.76 1-1.7 1.06-2.75.05-1.07.1-1.41.1-5.49s-.05-4.42-.1-5.49Zm-1.95 10.57a3.12 3.12 0 0 1-1.76 1.76c-1.22.48-4.12.37-5.59.37s-4.37.1-5.59-.37a3.12 3.12 0 0 1-1.76-1.76c-.48-1.22-.37-4.12-.37-5.59s-.1-4.37.37-5.59a3.12 3.12 0 0 1 1.76-1.76c1.22-.48 4.12-.37 5.59-.37s4.37-.1 5.59.37a3.12 3.12 0 0 1 1.76 1.76c.48 1.22.37 4.12.37 5.59s.1 4.37-.37 5.59Z'},
        {name: 'TikTok', href: 'https://www.tiktok.com/@gvhellas', icon: 'M16.6 5.82a4.75 4.75 0 0 0 2.78 2.12v2.53a7.3 7.3 0 0 1-2.77-.78v5.67A5.36 5.36 0 1 1 11.25 10a5.5 5.5 0 0 1 .75.05v2.61a2.75 2.75 0 1 0 1.98 2.64V2h2.62v3.82Z'}
    ] as const;


    const fallbackText: Record<UiLang, Record<string, string>> = {
        el: {
            'contact.successMessage': 'Σας ευχαριστούμε. Το μήνυμά σας στάλθηκε με επιτυχία.',
            'contact.errorMessage': 'Το μήνυμα δεν μπόρεσε να σταλεί. Παρακαλώ δοκιμάστε ξανά αργότερα.',
            'contact.sending': 'Αποστολή…',
            'contact.formSubtitle': 'Συμπληρώστε τη φόρμα και θα επικοινωνήσουμε μαζί σας το συντομότερο δυνατό.',
            'contact.namePlaceholder': 'Το ονοματεπώνυμό σας',
            'contact.emailPlaceholder': 'name@example.com',
            'contact.phonePlaceholder': '+41 …',
            'contact.messagePlaceholder': 'Πώς μπορούμε να σας βοηθήσουμε;',
            'contact.securityTitle': 'Έλεγχος ασφαλείας',
            'contact.securityDescription': 'Ο έλεγχος Cloudflare Turnstile προστατεύει τη φόρμα από ανεπιθύμητα αυτοματοποιημένα μηνύματα.',
            'contact.validation.captcha': 'Παρακαλώ ολοκληρώστε τον έλεγχο ασφαλείας.',
            'contact.validation.captchaFailed': 'Ο έλεγχος ασφαλείας απέτυχε ή έληξε. Παρακαλώ δοκιμάστε ξανά.',
            'contact.validation.captchaConfig': 'Ο έλεγχος ασφαλείας δεν έχει ρυθμιστεί ακόμη.',

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
            'contact.formSubtitle': 'Füllen Sie das Formular aus. Wir melden uns so bald wie möglich bei Ihnen.',
            'contact.namePlaceholder': 'Ihr Vor- und Nachname',
            'contact.emailPlaceholder': 'name@example.com',
            'contact.phonePlaceholder': '+41 …',
            'contact.messagePlaceholder': 'Wie können wir Ihnen helfen?',
            'contact.securityTitle': 'Sicherheitsprüfung',
            'contact.securityDescription': 'Cloudflare Turnstile schützt das Formular vor automatisierten Spam-Nachrichten.',
            'contact.validation.captcha': 'Bitte schließen Sie die Sicherheitsprüfung ab.',
            'contact.validation.captchaFailed': 'Die Sicherheitsprüfung ist fehlgeschlagen oder abgelaufen. Bitte versuchen Sie es erneut.',
            'contact.validation.captchaConfig': 'Die Sicherheitsprüfung ist noch nicht konfiguriert.',

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

    const mapQuery = 'Oberwilerweg 30, 4852 Rothrist, Schweiz';
    const mapUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(mapQuery)}`;
    const mapEmbedUrl =
        'https://www.openstreetmap.org/export/embed.html?bbox=7.84%2C47.28%2C7.94%2C47.34&layer=mapnik';

    let name = $state('');
    let email = $state('');
    let phone = $state('');
    let message = $state('');
    let website = $state('');
    let turnstileToken = $state('');
    let turnstileResetKey = $state(0);
    let captchaError = $state('');

    let loading = $state(false);
    let submitted = $state(false);
    let formError = $state('');
    let fieldErrors = $state<Partial<Record<ContactField, string>>>({});

    const lang = $derived(($locale === 'de' ? 'de' : 'el') as UiLang);
    const turnstileSiteKey = $derived(
        env.PUBLIC_TURNSTILE_SITE_KEY?.trim() || TURNSTILE_SITE_KEY
    );
    const turnstileConfigured = $derived(Boolean(turnstileSiteKey));
    const seoDescription = $derived(
        lang === 'de'
            ? 'Kontaktieren Sie den Griechischen Verein Hellas in der Schweiz und senden Sie uns Ihre Nachricht.'
            : 'Επικοινωνήστε με τον Ελληνικό Σύλλογο Hellas στην Ελβετία και στείλτε μας το μήνυμά σας.'
    );

    const inputClass =
        'h-12 rounded-md border-slate-300 bg-white pl-11 pr-4 text-[0.95rem] font-semibold text-slate-950 shadow-sm placeholder:font-normal placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-primary/25';

    const textareaClass =
        'min-h-40 resize-y rounded-md border-slate-300 bg-white px-4 py-3 text-[0.95rem] font-semibold leading-6 text-slate-950 shadow-sm placeholder:font-normal placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-primary/25';

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
            website: website.trim(),
            turnstileToken
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
        turnstileToken = '';
        captchaError = '';
        fieldErrors = {};
    }

    function resetCaptcha() {
        turnstileToken = '';
        turnstileResetKey += 1;
    }

    function handleCaptchaToken(token: string) {
        turnstileToken = token;
        captchaError = '';

        if (formError === text('contact.validation.captcha') || formError === text('contact.validation.captchaFailed')) {
            formError = '';
        }
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

        if (!turnstileConfigured) {
            formError = text('contact.validation.captchaConfig');
            return;
        }

        if (!data.turnstileToken) {
            captchaError = text('contact.validation.captcha');
            formError = captchaError;
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
                    resetCaptcha();
                    return;
                }

                if (result?.code === 'captcha_failed' || result?.code === 'captcha_expired') {
                    captchaError = text('contact.validation.captchaFailed');
                    formError = captchaError;
                    resetCaptcha();
                    return;
                }

                formError =
                    response.status === 429
                        ? text('contact.validation.rateLimit')
                        : text('contact.errorMessage');

                resetCaptcha();
                return;
            }

            submitted = true;
            resetForm();

            trackAnalyticsEvent(
                env.PUBLIC_GOOGLE_ANALYTICS_ID,
                'generate_lead',
                {
                    method: 'contact_form',
                    form_name: 'contact'
                }
            );
        } catch {
            formError = text('contact.errorMessage');
            resetCaptcha();
        } finally {
            loading = false;
        }
    }
</script>

<Seo title={$t('contact.headline')} description={seoDescription} />

<section class="grid gap-8 pb-10">
    <div class="max-w-3xl">
        <div class="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            <MailIcon class="size-3.5" />
            {$t('contact.headline')}
        </div>

        <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">
            {$t('contact.formHeadline')}
        </h1>

        <p class="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            {text('contact.formSubtitle')}
        </p>
    </div>

    <div class="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <Card.Root class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <Card.Header class="border-b border-slate-100 bg-slate-50/60 px-5 py-5 sm:px-7">
                <div class="flex items-start gap-3">
                    <div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <SendIcon class="size-5" />
                    </div>

                    <div>
                        <Card.Title class="text-xl">
                            {$t('contact.formHeadline')}
                        </Card.Title>
                        <p class="mt-1 text-sm leading-6 text-slate-500">
                            {text('contact.formSubtitle')}
                        </p>
                    </div>
                </div>
            </Card.Header>

            <Card.Content class="p-5 sm:p-7">
                {#if submitted}
                    <div
                        class="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-900"
                        role="status"
                    >
                        <CircleCheckIcon class="mt-0.5 size-5 shrink-0 text-emerald-600" />
                        <div>
                            <p class="font-bold">{text('contact.successMessage')}</p>
                            <button
                                type="button"
                                class="mt-2 text-sm font-semibold text-emerald-800 underline underline-offset-4 hover:text-emerald-950"
                                onclick={() => {
                                    submitted = false;
                                    resetCaptcha();
                                }}
                            >
                                {$t('contact.send')}
                            </button>
                        </div>
                    </div>
                {:else}
                    <form class="grid gap-5" novalidate onsubmit={handleSubmit}>
                        <div class="honeypot" aria-hidden="true">
                            <Label for={`${id}-website`}>Website</Label>
                            <Input
                                id={`${id}-website`}
                                tabindex={-1}
                                autocomplete="off"
                                bind:value={website}
                            />
                        </div>

                        <div class="grid gap-5 sm:grid-cols-2">
                            <div class="field">
                                <Label for={`${id}-name`} class="px-1 text-sm font-bold text-slate-800">
                                    {$t('contact.name')}
                                </Label>

                                <div class="relative">
                                    <UserRoundIcon class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        id={`${id}-name`}
                                        type="text"
                                        autocomplete="name"
                                        placeholder={text('contact.namePlaceholder')}
                                        bind:value={name}
                                        aria-invalid={!!fieldErrors.name}
                                        aria-describedby={fieldErrors.name ? `${id}-name-error` : undefined}
                                        class={cn(inputClass, fieldErrors.name && invalidClass)}
                                        oninput={() => handleInput('name')}
                                    />
                                </div>

                                {#if fieldErrors.name}
                                    <p id={`${id}-name-error`} class="field-error">
                                        {fieldErrors.name}
                                    </p>
                                {/if}
                            </div>

                            <div class="field">
                                <Label for={`${id}-email`} class="px-1 text-sm font-bold text-slate-800">
                                    {$t('contact.email')}
                                </Label>

                                <div class="relative">
                                    <MailIcon class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        id={`${id}-email`}
                                        type="email"
                                        autocomplete="email"
                                        placeholder={text('contact.emailPlaceholder')}
                                        bind:value={email}
                                        aria-invalid={!!fieldErrors.email}
                                        aria-describedby={fieldErrors.email ? `${id}-email-error` : undefined}
                                        class={cn(inputClass, fieldErrors.email && invalidClass)}
                                        oninput={() => handleInput('email')}
                                    />
                                </div>

                                {#if fieldErrors.email}
                                    <p id={`${id}-email-error`} class="field-error">
                                        {fieldErrors.email}
                                    </p>
                                {/if}
                            </div>
                        </div>

                        <div class="field">
                            <Label for={`${id}-phone`} class="px-1 text-sm font-bold text-slate-800">
                                {$t('contact.phone')}
                            </Label>

                            <div class="relative">
                                <PhoneIcon class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    id={`${id}-phone`}
                                    type="tel"
                                    autocomplete="tel"
                                    placeholder={text('contact.phonePlaceholder')}
                                    bind:value={phone}
                                    aria-invalid={!!fieldErrors.phone}
                                    aria-describedby={fieldErrors.phone ? `${id}-phone-error` : undefined}
                                    class={cn(inputClass, fieldErrors.phone && invalidClass)}
                                    oninput={() => handleInput('phone')}
                                />
                            </div>

                            {#if fieldErrors.phone}
                                <p id={`${id}-phone-error`} class="field-error">
                                    {fieldErrors.phone}
                                </p>
                            {/if}
                        </div>

                        <div class="field">
                            <Label for={`${id}-message`} class="px-1 text-sm font-bold text-slate-800">
                                {$t('contact.message')}
                            </Label>

                            <Textarea
                                id={`${id}-message`}
                                rows={6}
                                placeholder={text('contact.messagePlaceholder')}
                                bind:value={message}
                                aria-invalid={!!fieldErrors.message}
                                aria-describedby={fieldErrors.message ? `${id}-message-error` : undefined}
                                class={cn(textareaClass, fieldErrors.message && invalidClass)}
                                oninput={() => handleInput('message')}
                            ></Textarea>

                            {#if fieldErrors.message}
                                <p id={`${id}-message-error`} class="field-error">
                                    {fieldErrors.message}
                                </p>
                            {/if}
                        </div>

                        <div class="rounded-md border border-slate-200 bg-slate-50/70 p-4">
                            <div class="mb-3 flex items-start gap-3">
                                <div class="flex size-9 shrink-0 items-center justify-center rounded-md bg-white text-primary shadow-sm ring-1 ring-slate-200">
                                    <ShieldCheckIcon class="size-4.5" />
                                </div>
                                <div>
                                    <p class="text-sm font-bold text-slate-900">
                                        {text('contact.securityTitle')}
                                    </p>
                                    <p class="mt-0.5 text-xs leading-5 text-slate-500">
                                        {text('contact.securityDescription')}
                                    </p>
                                </div>
                            </div>

                            {#if turnstileConfigured}
                                <Turnstile
                                    siteKey={turnstileSiteKey}
                                    action="contact_form"
                                    resetKey={turnstileResetKey}
                                    onToken={handleCaptchaToken}
                                    onExpired={() => {
                                        captchaError = text('contact.validation.captchaFailed');
                                    }}
                                    onError={() => {
                                        captchaError = text('contact.validation.captchaFailed');
                                    }}
                                />
                            {:else}
                                <p class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                                    {text('contact.validation.captchaConfig')}
                                </p>
                            {/if}

                            {#if captchaError}
                                <p class="mt-2 text-xs font-semibold text-destructive" role="alert">
                                    {captchaError}
                                </p>
                            {/if}
                        </div>

                        {#if formError}
                            <p class="form-error" role="alert">
                                {formError}
                            </p>
                        {/if}

                        <div class="flex justify-end">
                            <Button
                                type="submit"
                                disabled={loading || !turnstileConfigured || !turnstileToken}
                                class="h-11 min-w-40 rounded-md px-6 font-bold shadow-sm"
                            >
                                {#if loading}
                                    <Loader2Icon class="mr-2 size-4 animate-spin" />
                                    {text('contact.sending')}
                                {:else}
                                    <SendIcon class="mr-2 size-4" />
                                    {$t('contact.send')}
                                {/if}
                            </Button>
                        </div>
                    </form>
                {/if}
            </Card.Content>
        </Card.Root>

        <div class="grid content-start gap-5">
            <Card.Root class="rounded-lg border border-slate-200 bg-white shadow-sm">
                <Card.Header class="pb-3">
                    <Card.Title class="flex items-center gap-2 text-lg">
                        <MapPinIcon class="size-5 text-primary" />
                        {$t('contact.address')}
                    </Card.Title>
                </Card.Header>

                <Card.Content class="grid gap-3">
                    <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener"
                        class="contact-row group"
                    >
                        <div class="contact-icon">
                            <MapPinIcon class="size-4.5" />
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="text-xs font-bold uppercase tracking-wide text-slate-400">
                                {$t('contact.address')}
                            </p>
                            <p class="mt-0.5 font-semibold leading-6 text-slate-900">
                                Oberwilerweg 30<br />
                                4852 Rothrist<br />
                                Schweiz
                            </p>
                        </div>
                        <ExternalLinkIcon class="size-4 shrink-0 text-slate-300 transition group-hover:text-primary" />
                    </a>

                    <a href="tel:+41787296030" class="contact-row group">
                        <div class="contact-icon">
                            <PhoneIcon class="size-4.5" />
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="text-xs font-bold uppercase tracking-wide text-slate-400">
                                {$t('contact.phoneContact')}
                            </p>
                            <p class="mt-0.5 font-semibold text-slate-900">
                                +41 (0)78 729 60 30
                            </p>
                        </div>
                    </a>

                    <a href="mailto:info@gv-hellas.ch" class="contact-row group">
                        <div class="contact-icon">
                            <MailIcon class="size-4.5" />
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="text-xs font-bold uppercase tracking-wide text-slate-400">Email</p>
                            <p class="mt-0.5 truncate font-semibold text-slate-900">
                                info@gv-hellas.ch
                            </p>
                        </div>
                    </a>
                </Card.Content>
            </Card.Root>

            <Card.Root class="rounded-lg border border-slate-200 bg-white shadow-sm">
                <Card.Header class="pb-3">
                    <Card.Title class="text-lg">
                        {$t('contact.followUs')}
                    </Card.Title>
                </Card.Header>

                <Card.Content>
                    <div class="flex flex-wrap gap-2">
                        {#each socials as social}
                            <a class="social-link" href={social.href} target="_blank" rel="noopener">
                                <svg viewBox="0 0 24 24" class="size-4 fill-current" aria-hidden="true">
                                    <path d={social.icon}></path>
                                </svg>
                                <span>{social.name}</span>
                            </a>
                        {/each}
                    </div>
                </Card.Content>
            </Card.Root>
        </div>
    </div>

    <div class="full-width-map">
        <iframe
            title="OpenStreetMap - Oberwilerweg 30, 4852 Rothrist"
            src={mapEmbedUrl}
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
        ></iframe>

        <a href={mapUrl} target="_blank" rel="noopener" class="map-link">
            {text('contact.openInMaps')}
            <ExternalLinkIcon class="size-3.5" />
        </a>
    </div>
</section>

<style>
    .field {
        display: grid;
        gap: .5rem;
    }

    .field-error,
    .form-error {
        margin: 0;
        color: hsl(var(--destructive));
        font-size: 0.8125rem;
        font-weight: 600;
        line-height: 1.25rem;
    }

    .form-error {
        border: 1px solid hsl(var(--destructive) / 0.25);
        border-radius: .875rem;
        background: hsl(var(--destructive) / 0.08);
        padding: .8rem 1rem;
    }

    .honeypot {
        position: absolute;
        left: -9999px;
        width: 1px;
        height: 1px;
        overflow: hidden;
    }

    .contact-row {
        display: flex;
        align-items: center;
        gap: .875rem;
        border-radius: .375rem;
        border: 1px solid rgb(226 232 240);
        background: rgb(248 250 252 / .7);
        padding: .9rem 1rem;
        text-decoration: none;
        transition: border-color 150ms ease, background 150ms ease, transform 150ms ease;
    }

    .contact-row:hover {
        border-color: hsl(var(--primary) / .3);
        background: white;
        transform: translateY(-1px);
    }

    .contact-icon {
        display: flex;
        width: 2.25rem;
        height: 2.25rem;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        border-radius: .375rem;
        background: hsl(var(--primary) / .08);
        color: hsl(var(--primary));
    }

    .social-link {
        display: inline-flex;
        align-items: center;
        gap: .45rem;
        border-radius: .375rem;
        border: 1px solid rgb(226 232 240);
        background: rgb(248 250 252);
        padding: .5rem .8rem;
        color: rgb(51 65 85);
        font-size: .875rem;
        font-weight: 700;
        text-decoration: none;
        transition: border-color 140ms ease, color 140ms ease, background 140ms ease;
    }

    .social-link:hover {
        border-color: hsl(var(--primary) / .3);
        background: hsl(var(--primary) / .05);
        color: hsl(var(--primary));
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
        display: inline-flex;
        align-items: center;
        gap: .4rem;
        border-radius: 999px;
        background: white;
        padding: .65rem .95rem;
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
