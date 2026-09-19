<script lang="ts">
    import {env} from '$env/dynamic/public';
    import {t, locale} from '$lib/i18n';
    import {trackAnalyticsEvent} from '$lib/analytics';
    import Seo from '$lib/components/Seo.svelte';
    import Turnstile from '$lib/components/Turnstile.svelte';
    import {Button} from '$lib/components/ui/button/index.js';
    import {Input} from '$lib/components/ui/input/index.js';
    import {Label} from '$lib/components/ui/label/index.js';
    import {Textarea} from '$lib/components/ui/textarea/index.js';
    import {toast} from 'svelte-sonner';

    import SchoolIcon from '@lucide/svelte/icons/school';
    import MapPinIcon from '@lucide/svelte/icons/map-pin';
    import DoorOpenIcon from '@lucide/svelte/icons/door-open';
    import UsersIcon from '@lucide/svelte/icons/users';
    import ImageIcon from '@lucide/svelte/icons/image';
    import SendIcon from '@lucide/svelte/icons/send';
    import Loader2Icon from '@lucide/svelte/icons/loader-2';
    import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';

    type Lang = 'el' | 'de';

    const TURNSTILE_SITE_KEY = '0x4AAAAAAE89AxpjSZqxEP-s';

    let parentName = $state('');
    let email = $state('');
    let phone = $state('');
    let childName = $state('');
    let childBirthDate = $state('');
    let languageLevel = $state('');
    let message = $state('');
    let website = $state('');
    let consent = $state(false);
    let loading = $state(false);
    let turnstileToken = $state('');
    let turnstileResetKey = $state(0);
    let captchaError = $state('');

    const lang = $derived(($locale === 'de' ? 'de' : 'el') as Lang);
    const turnstileSiteKey = $derived(env.PUBLIC_TURNSTILE_SITE_KEY?.trim() || TURNSTILE_SITE_KEY);
    const seoDescription = $derived(
        lang === 'de'
            ? 'Informationen und Anmeldung für die Griechische Schule des Griechischen Vereins Hellas.'
            : 'Πληροφορίες και φόρμα εγγραφής για το Ελληνικό Σχολείο του Ελληνικού Συλλόγου Hellas.'
    );

    function resetCaptcha() {
        turnstileToken = '';
        captchaError = '';
        turnstileResetKey += 1;
    }

    async function submitRegistration(event: SubmitEvent) {
        event.preventDefault();
        if (loading || !consent) return;

        if (!turnstileToken) {
            captchaError = $t('contact.validation.captcha');
            toast.error(captchaError);
            return;
        }

        loading = true;

        try {
            const response = await fetch('/api/school-registration', {
                method: 'POST',
                headers: {'content-type': 'application/json'},
                body: JSON.stringify({
                    parentName,
                    email,
                    phone,
                    childName,
                    childBirthDate,
                    languageLevel,
                    message,
                    website,
                    turnstileToken
                })
            });

            const result = await response.json().catch(() => null);

            if (!response.ok || !result?.ok) {
                if (result?.code === 'captcha_failed' || result?.code === 'captcha_expired') {
                    captchaError = $t('contact.validation.captchaFailed');
                }
                throw new Error(result?.message || 'Registration failed');
            }

            trackAnalyticsEvent(env.PUBLIC_GOOGLE_ANALYTICS_ID, 'generate_lead', {
                lead_source: 'greek_school_registration'
            });
            toast.success($t('school.form.success'));
            parentName = '';
            email = '';
            phone = '';
            childName = '';
            childBirthDate = '';
            languageLevel = '';
            message = '';
            website = '';
            consent = false;
            resetCaptcha();
        } catch {
            toast.error(captchaError || $t('school.form.error'));
            resetCaptcha();
        } finally {
            loading = false;
        }
    }
</script>

<Seo title={$t('school.headline')} description={seoDescription} />

<header class="border-b-2 border-primary/35 pb-10 pt-4 md:pb-14 md:pt-8">
    <SchoolIcon class="size-9 text-primary" />
    <h1 class="mt-5 max-w-3xl text-4xl font-black tracking-tight text-slate-950 md:text-5xl">{$t('school.headline')}</h1>
    <p class="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{$t('school.intro')}</p>
</header>

<section class="grid border-b border-slate-300 sm:grid-cols-3">
    <article class="border-b border-slate-200 px-1 py-7 sm:border-b-0 sm:border-r sm:px-6">
        <MapPinIcon class="size-6 text-primary" />
        <p class="mt-4 text-sm font-semibold text-slate-500">{$t('school.facts.address')}</p>
        <p class="mt-1 font-bold text-slate-900">{$t('school.facts.pending')}</p>
    </article>
    <article class="border-b border-slate-200 px-1 py-7 sm:border-b-0 sm:border-r sm:px-6">
        <DoorOpenIcon class="size-6 text-primary" />
        <p class="mt-4 text-sm font-semibold text-slate-500">{$t('school.facts.classrooms')}</p>
        <p class="mt-1 font-bold text-slate-900">{$t('school.facts.pending')}</p>
    </article>
    <article class="px-1 py-7 sm:px-6">
        <UsersIcon class="size-6 text-primary" />
        <p class="mt-4 text-sm font-semibold text-slate-500">{$t('school.facts.ageGroups')}</p>
        <p class="mt-1 font-bold text-slate-900">{$t('school.facts.pending')}</p>
    </article>
</section>

<section class="my-12">
    <div class="mb-5">
        <h2 class="text-2xl font-bold text-slate-950">{$t('school.photos.title')}</h2>
        <p class="mt-2 text-slate-600">{$t('school.photos.description')}</p>
    </div>
    <div class="grid gap-4 sm:grid-cols-3">
        {#each [1, 2, 3] as photo}
            <div class="flex aspect-[4/3] items-center justify-center border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                <div class="text-center">
                    <ImageIcon class="mx-auto size-8" />
                    <p class="mt-2 text-sm font-semibold">{$t('school.photos.placeholder')} {photo}</p>
                </div>
            </div>
        {/each}
    </div>
</section>

<section class="my-12 grid gap-0 border-y border-slate-300 lg:grid-cols-[.8fr_1.2fr] lg:items-stretch">
    <div class="bg-blue-950 p-7 text-white md:p-8">
        <h2 class="text-2xl font-bold">{$t('school.form.title')}</h2>
        <p class="mt-3 leading-7 text-blue-100/80">{$t('school.form.description')}</p>
    </div>

    <form class="grid gap-5 bg-white p-6 md:p-8" onsubmit={submitRegistration}>
        <div class="grid gap-5 sm:grid-cols-2">
            <div class="grid gap-1.5">
                <Label for="school-parent-name">{$t('school.form.parentName')}</Label>
                <Input id="school-parent-name" bind:value={parentName} required minlength="2" class="rounded-md font-semibold" />
            </div>
            <div class="grid gap-1.5">
                <Label for="school-email">{$t('contact.email')}</Label>
                <Input id="school-email" type="email" bind:value={email} required class="rounded-md font-semibold" />
            </div>
            <div class="grid gap-1.5">
                <Label for="school-phone">{$t('contact.phone')}</Label>
                <Input id="school-phone" type="tel" bind:value={phone} class="rounded-md font-semibold" />
            </div>
            <div class="grid gap-1.5">
                <Label for="school-child-name">{$t('school.form.childName')}</Label>
                <Input id="school-child-name" bind:value={childName} required minlength="2" class="rounded-md font-semibold" />
            </div>
            <div class="grid gap-1.5">
                <Label for="school-birth-date">{$t('school.form.childBirthDate')}</Label>
                <Input id="school-birth-date" type="date" bind:value={childBirthDate} required class="rounded-md font-semibold" />
            </div>
            <div class="grid gap-1.5">
                <Label for="school-language-level">{$t('school.form.languageLevel')}</Label>
                <Input id="school-language-level" bind:value={languageLevel} class="rounded-md font-semibold" placeholder={$t('school.form.languageLevelPlaceholder')} />
            </div>
        </div>

        <div class="grid gap-1.5">
            <Label for="school-message">{$t('school.form.message')}</Label>
            <Textarea id="school-message" bind:value={message} rows={5} class="rounded-md font-semibold" />
        </div>

        <div class="hidden" aria-hidden="true">
            <Label for="school-website">Website</Label>
            <Input id="school-website" bind:value={website} tabindex="-1" autocomplete="off" />
        </div>

        <label class="flex items-start gap-3 border-l-2 border-primary/35 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            <input type="checkbox" bind:checked={consent} required class="mt-1 size-4 border-slate-300" />
            <span>{$t('school.form.consent')}</span>
        </label>

        <div class="border-t border-slate-200 pt-4">
            <div class="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                <ShieldCheckIcon class="size-4 text-primary" />
                {$t('contact.securityTitle')}
            </div>
            <Turnstile
                siteKey={turnstileSiteKey}
                action="school_registration"
                resetKey={turnstileResetKey}
                onToken={(token) => {
                    turnstileToken = token;
                    captchaError = '';
                }}
                onExpired={() => (captchaError = $t('contact.validation.captchaFailed'))}
                onError={() => (captchaError = $t('contact.validation.captchaFailed'))}
            />
            {#if captchaError}
                <p class="mt-2 text-xs font-semibold text-destructive" role="alert">{captchaError}</p>
            {/if}
        </div>

        <div class="flex justify-end">
            <Button type="submit" class="rounded-md" disabled={loading || !consent || !turnstileToken}>
                {#if loading}
                    <Loader2Icon class="mr-2 size-4 animate-spin" />
                    {$t('school.form.sending')}
                {:else}
                    <SendIcon class="mr-2 size-4" />
                    {$t('school.form.submit')}
                {/if}
            </Button>
        </div>
    </form>
</section>
