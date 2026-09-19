<script lang="ts">
    import {t, locale} from '$lib/i18n';
    import Seo from '$lib/components/Seo.svelte';

    import UsersIcon from '@lucide/svelte/icons/users';
    import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
    import MapPinIcon from '@lucide/svelte/icons/map-pin';
    import LockKeyholeIcon from '@lucide/svelte/icons/lock-keyhole';
    import FileTextIcon from '@lucide/svelte/icons/file-text';
    import LandmarkIcon from '@lucide/svelte/icons/landmark';

    type Lang = 'el' | 'de';

    const board = [
        {role: 'president', name: 'Παναγιώτης Παπουτσης'},
        {role: 'vicePresident', name: 'Μιχάλης Τσούτης'},
        {role: 'secretary', name: 'Ρόζα Αγγελίδη Μπαλαμπάνη'},
        {role: 'treasurer', name: 'Δημήτριος Τσιτσιάμης'}
    ] as const;

    const memberMaterials = ['financialStatements', 'minutes', 'documents'] as const;
    const lang = $derived(($locale === 'de' ? 'de' : 'el') as Lang);
    const seoDescription = $derived(
        lang === 'de'
            ? 'Informationen über den Griechischen Verein Hellas in Rothrist, seinen Vorstand, seine Geschichte und den Mitgliederbereich.'
            : 'Πληροφορίες για τον Ελληνικό Σύλλογο Hellas στο Rothrist, το διοικητικό συμβούλιο, την ιστορία και το υλικό για τα μέλη.'
    );
</script>

<Seo title={$t('verein.headline')} description={seoDescription} />

<header class="border-b-2 border-primary/35 pb-10 pt-4 md:pb-14 md:pt-8">
    <p class="text-sm font-black uppercase tracking-[0.18em] text-primary">{$t('verein.eyebrow')}</p>
    <h1 class="mt-3 max-w-3xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
        {$t('verein.headline')}
    </h1>
    <p class="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
        {$t('verein.intro')}
    </p>
</header>

<section class="grid border-b border-slate-300 sm:grid-cols-3">
    <article class="border-b border-slate-200 px-1 py-7 sm:border-b-0 sm:border-r sm:px-6">
        <CalendarDaysIcon class="size-6 text-primary" />
        <p class="mt-4 text-sm font-semibold text-slate-500">{$t('verein.facts.foundedLabel')}</p>
        <p class="mt-1 text-3xl font-black text-slate-950">2019</p>
    </article>

    <article class="border-b border-slate-200 px-1 py-7 sm:border-b-0 sm:border-r sm:px-6">
        <MapPinIcon class="size-6 text-primary" />
        <p class="mt-4 text-sm font-semibold text-slate-500">{$t('verein.facts.baseLabel')}</p>
        <p class="mt-1 text-3xl font-black text-slate-950">Rothrist</p>
    </article>

    <article class="px-1 py-7 sm:px-6">
        <UsersIcon class="size-6 text-primary" />
        <p class="mt-4 text-sm font-semibold text-slate-500">{$t('verein.facts.membersLabel')}</p>
        <p class="mt-1 text-lg font-bold text-slate-700">{$t('verein.facts.membersPending')}</p>
    </article>
</section>

<section class="py-14">
    <div class="mb-8 max-w-3xl">
        <p class="text-sm font-black uppercase tracking-[0.18em] text-primary">{$t('verein.board.eyebrow')}</p>
        <h2 class="mt-2 text-3xl font-bold text-slate-950">{$t('verein.board.title')}</h2>
        <p class="mt-2 text-slate-600">{$t('verein.board.description')}</p>
    </div>

    <div class="grid border-y border-slate-300 sm:grid-cols-2 lg:grid-cols-4">
        {#each board as member, index}
            <article class={`min-h-44 px-1 py-6 sm:px-5 ${index < board.length - 1 ? 'lg:border-r lg:border-slate-200' : ''}`}>
                <UsersIcon class="size-5 text-primary" />
                <p class="mt-5 text-xs font-black uppercase tracking-[0.14em] text-primary">
                    {$t(`verein.board.roles.${member.role}`)}
                </p>
                <h3 class="mt-2 text-lg font-black leading-snug text-slate-950">{member.name}</h3>
            </article>
        {/each}
    </div>
</section>

<section class="grid border-y border-slate-300 lg:grid-cols-2">
    <article class="px-1 py-9 lg:border-r lg:border-slate-300 lg:px-8">
        <LandmarkIcon class="size-7 text-primary" />
        <h2 class="mt-4 text-2xl font-bold text-slate-950">{$t('verein.mission.title')}</h2>
        <p class="mt-3 max-w-2xl leading-7 text-slate-600">{$t('verein.mission.text')}</p>
    </article>

    <article class="bg-blue-950 px-6 py-9 text-white lg:px-8">
        <LockKeyholeIcon class="size-7 text-blue-300" />
        <h2 class="mt-4 text-2xl font-bold">{$t('verein.membersArea.title')}</h2>
        <p class="mt-3 max-w-2xl text-blue-100/80">{$t('verein.membersArea.description')}</p>
    </article>
</section>

<section class="py-14">
    <div class="mb-6 flex items-center gap-3">
        <FileTextIcon class="size-6 text-primary" />
        <h2 class="text-2xl font-bold text-slate-950">{$t('verein.membersArea.materialTitle')}</h2>
    </div>

    <div class="divide-y divide-slate-200 border-y border-slate-300">
        {#each memberMaterials as item}
            <article class="flex items-start justify-between gap-6 py-5">
                <div>
                    <h3 class="font-bold text-slate-900">{$t(`verein.membersArea.${item}`)}</h3>
                    <p class="mt-1 text-sm leading-6 text-slate-500">{$t('verein.membersArea.placeholder')}</p>
                </div>
                <LockKeyholeIcon class="mt-1 size-5 shrink-0 text-slate-400" />
            </article>
        {/each}
    </div>
</section>
