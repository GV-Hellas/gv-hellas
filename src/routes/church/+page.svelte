<script lang="ts">
    import { t, json } from '$lib/i18n';

    // Use $json instead of $t for objects
    $: current = $json('church.schedules.current');
    $: previous = $json('church.schedules.previous');
    $: ui = $json('church.ui');

    let showPrevious = false;

    // ---- Backward/forward compatible helpers ----
    $: previousSections =
        previous?.sections ??
        (previous?.entries
            ? [
                {
                    title: '',
                    rows: previous.entries.map((e) => ({
                        date: e.date,
                        event: e.service,
                        service: '',
                        time: e.time
                    })),
                    highlight: previous.highlight
                }
            ]
            : []);

    $: previousSignatureLines =
        Array.isArray(previous?.signature) ? previous.signature : previous?.signature?.lines ?? [];
</script>

<svelte:head>
    <title>{$t('church.headline')} - GV Hellas</title>
</svelte:head>

<section class="space-y-6">
    <header class="space-y-2">
        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            {$t('church.headline')}
        </h1>
        <p class="max-w-2xl text-slate-700">
            {$t('church.description')}
        </p>
    </header>

    <!-- NEW (current) schedule -->
    <article class="rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur shadow-sm">
        <div class="p-6 sm:p-8">
            <!-- Header block (keep your UI/typography) -->
            <div class="relative">
                <div class="float-left text-left space-y-1">
                    <div class="space-y-1">
                        <p class="text-sm sm:text-base font-extrabold tracking-wide text-[color:var(--color-primary-dark)]">
                            {current.meta.parishLine1 ?? current.meta.parish}
                        </p>

                        {#if current.meta.parishLine2}
                            <p class="text-sm sm:text-base font-extrabold tracking-wide text-[color:var(--color-primary-dark)]">
                                {current.meta.parishLine2}
                            </p>
                        {/if}

                        <p class="text-sm text-slate-600">
              <span class="inline-flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                  {current.meta.address}
              </span><br />

                            <span class="inline-flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                                {current.contact.phone}
              </span><br />

                            <a
                                    href={"mailto:" + current.contact.email}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="inline-flex items-center gap-2 hover:text-[color:var(--color-primary-dark)] transition-colors"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                                    />
                                </svg>
                                {current.contact.email}
                            </a><br />

                            <a
                                    href={current.contact.facebookUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="inline-flex items-center gap-2 hover:text-[color:var(--color-primary-dark)] transition-colors"
                            >
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path
                                            d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                                    />
                                </svg>
                                {current.contact.facebookName}
                            </a>
                        </p>
                    </div>
                </div>

                <div class="float-right text-right space-y-1 pl-4">
                    {#if current.meta.line1}
                        <p class="text-xs sm:text-sm font-semibold tracking-wide text-slate-700">{current.meta.line1}</p>
                    {/if}
                    {#if current.meta.line2}
                        <p class="text-xs sm:text-sm font-semibold tracking-wide text-slate-700">{current.meta.line2}</p>
                    {/if}

                    {#if current.meta.lines}
                        {#each current.meta.lines as line (line)}
                            <p class="text-xs sm:text-sm font-semibold tracking-wide text-slate-700">{line}</p>
                        {/each}
                    {/if}
                </div>

                <div class="clear-both"></div>
            </div>

            <div class="my-6 h-px bg-slate-200/80"></div>

            <!-- Program title -->
            <div class="text-center space-y-1">
                <h2 class="text-lg sm:text-xl font-extrabold text-slate-900">
                    {current.program.title}
                </h2>
                <p class="text-sm sm:text-base font-semibold text-slate-700">
                    {current.program.subtitle}
                </p>
            </div>

            <!-- NEW schedule: supports multiple sections -->
            <div class="mt-6 space-y-8">
                {#each current.sections as section, sIdx (sIdx)}
                    <div class="space-y-3">
                        {#if section.title}
                            <div class="text-center">
                                <p class="text-sm sm:text-base font-extrabold text-slate-900">
                                    {section.title}
                                </p>
                            </div>
                        {/if}

                        <div class="overflow-x-auto">
                            <table class="min-w-full text-sm">
                                <thead class="text-left text-xs text-gray-400">
                                <tr class="border-b border-slate-200/70">
                                    <th class="py-2 pr-4 font-bold uppercase">{current.table.date}</th>
                                    <th class="py-2 pr-4 font-bold uppercase">{current.table.event}</th>

                                    {#if current.table.service}
                                        <th class="py-2 pr-4 font-bold uppercase hidden sm:table-cell">{current.table.service}</th>
                                    {/if}

                                    <th class="py-2 text-right font-semibold uppercase">{current.table.time}</th>
                                </tr>
                                </thead>

                                <tbody class="divide-y divide-slate-200/70">
                                {#each section.rows as row (row.date + row.time + row.event)}
                                    <tr class="align-top">
                                        <td class="py-3 pr-4 font-semibold text-slate-900 whitespace-nowrap tabular-nums">
                                            {row.date}
                                        </td>

                                        <td class="py-3 pr-4 text-slate-800">
                                            <div class={row.emphasis ? 'font-extrabold text-[color:var(--color-primary-dark)]' : ''}>
                                                {row.event}
                                            </div>

                                            {#if row.note}
                                                <div class="mt-1 text-xs text-slate-500">
                                                    {row.note}
                                                </div>
                                            {/if}
                                        </td>

                                        {#if current.table.service}
                                            <td class="py-3 pr-4 text-slate-700 hidden sm:table-cell">
                                                {row.service}
                                            </td>
                                        {/if}

                                        <td class="py-3 text-right font-semibold text-slate-900 whitespace-nowrap tabular-nums">
                                            {row.time}
                                        </td>
                                    </tr>
                                {/each}
                                </tbody>
                            </table>
                        </div>

                        {#if section.highlight}
                            <div class="rounded-xl border border-slate-200/70 bg-[color:var(--color-secondary-light)] p-4">
                                <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div class="space-y-1">
                                        <p class="text-sm font-semibold text-slate-900 tabular-nums">
                                            {section.highlight.date}
                                        </p>
                                        <p class="text-slate-700">
                                            {section.highlight.text}
                                        </p>
                                    </div>

                                    <div class="text-slate-900 font-extrabold text-lg sm:text-xl tabular-nums">
                                        {section.highlight.time}
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>

            <!-- Signature (new schedule) -->
            {#if current.signature?.lines}
                <div class="mt-8 text-center space-y-3">
                    <div class="space-y-1 text-sm text-slate-700">
                        {#each current.signature.lines as line (line)}
                            <p>{line}</p>
                        {/each}
                    </div>
                </div>
            {/if}

            <!-- Toggle button for previous schedule -->
            <div class="mt-8 flex justify-center">
                <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-white/90 transition-colors"
                        on:click={() => (showPrevious = !showPrevious)}
                        aria-expanded={showPrevious}
                >
                    {showPrevious ? ui.hidePrevious : ui.showPrevious}
                    <svg
                            viewBox="0 0 20 20"
                            class={"h-4 w-4 transition-transform " + (showPrevious ? 'rotate-180' : '')}
                            aria-hidden="true"
                    >
                        <path
                                fill="currentColor"
                                d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z"
                        />
                    </svg>
                </button>
            </div>
        </div>
    </article>

    <!-- OLD (previous) schedule hidden by default -->
    {#if showPrevious}
        <article class="rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur shadow-sm">
            <div class="p-6 sm:p-8">
                <!-- Header block (reuse your UI) -->
                <div class="relative">
                    <div class="float-left text-left space-y-1">
                        <div class="space-y-1">
                            <p class="text-sm sm:text-base font-extrabold tracking-wide text-[color:var(--color-primary-dark)]">
                                {previous.meta.parishLine1 ?? previous.meta.parish}
                            </p>

                            {#if previous.meta.parishLine2}
                                <p class="text-sm sm:text-base font-extrabold tracking-wide text-[color:var(--color-primary-dark)]">
                                    {previous.meta.parishLine2}
                                </p>
                            {/if}

                            <p class="text-sm text-slate-600">
                <span class="inline-flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                    {previous.meta.address}
                </span><br />

                                <span class="inline-flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                                    {previous.contact.phone}
                </span><br />

                                <a
                                        href={"mailto:" + previous.contact.email}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="inline-flex items-center gap-2 hover:text-[color:var(--color-primary-dark)] transition-colors"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                                        />
                                    </svg>
                                    {previous.contact.email}
                                </a><br />

                                <a
                                        href={previous.contact.facebookUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="inline-flex items-center gap-2 hover:text-[color:var(--color-primary-dark)] transition-colors"
                                >
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path
                                                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                                        />
                                    </svg>
                                    {previous.contact.facebookName}
                                </a>
                            </p>
                        </div>
                    </div>

                    <div class="float-right text-right space-y-1 pl-4">
                        {#if previous.meta.line1}
                            <p class="text-xs sm:text-sm font-semibold tracking-wide text-slate-700">{previous.meta.line1}</p>
                        {/if}
                        {#if previous.meta.line2}
                            <p class="text-xs sm:text-sm font-semibold tracking-wide text-slate-700">{previous.meta.line2}</p>
                        {/if}

                        {#if previous.meta.lines}
                            {#each previous.meta.lines as line (line)}
                                <p class="text-xs sm:text-sm font-semibold tracking-wide text-slate-700">{line}</p>
                            {/each}
                        {/if}
                    </div>

                    <div class="clear-both"></div>
                </div>

                <div class="my-6 h-px bg-slate-200/80"></div>

                <!-- Program title -->
                <div class="text-center space-y-1">
                    <h2 class="text-lg sm:text-xl font-extrabold text-slate-900">
                        {previous.program.title}
                    </h2>
                    <p class="text-sm sm:text-base font-semibold text-slate-700">
                        {previous.program.subtitle}
                    </p>
                </div>

                <!-- FIXED: Previous schedule now renders from previous.sections[].rows -->
                <div class="mt-6 space-y-8">
                    {#each previousSections as section, psIdx (psIdx)}
                        <div class="space-y-3">
                            {#if section.title}
                                <div class="text-center">
                                    <p class="text-sm sm:text-base font-extrabold text-slate-900">
                                        {section.title}
                                    </p>
                                </div>
                            {/if}

                            <div class="overflow-x-auto">
                                <table class="min-w-full text-sm">
                                    <thead class="text-left text-xs text-gray-400">
                                    <tr class="border-b border-slate-200/70">
                                        <th class="py-2 pr-4 font-bold uppercase">{previous.table.date}</th>
                                        <th class="py-2 pr-4 font-bold uppercase">{previous.table.event}</th>
                                        <th class="py-2 text-right font-semibold uppercase">{previous.table.time}</th>
                                    </tr>
                                    </thead>

                                    <tbody class="divide-y divide-slate-200/70">
                                    {#each section.rows as row (row.date + row.time + row.event)}
                                        <tr class="align-top">
                                            <td class="py-3 pr-4 font-semibold text-slate-900 whitespace-nowrap tabular-nums">
                                                {row.date}
                                            </td>
                                            <td class="py-3 pr-4 text-slate-800">
                                                {row.event}
                                            </td>
                                            <td class="py-3 text-right font-semibold text-slate-900 whitespace-nowrap tabular-nums">
                                                {row.time}
                                            </td>
                                        </tr>
                                    {/each}
                                    </tbody>
                                </table>
                            </div>

                            {#if section.highlight}
                                <div class="rounded-xl border border-slate-200/70 bg-[color:var(--color-secondary-light)] p-4">
                                    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div class="space-y-1">
                                            <p class="text-sm font-semibold text-slate-900 tabular-nums">
                                                {section.highlight.date}
                                            </p>
                                            <p class="text-slate-700">
                                                {section.highlight.text}
                                            </p>
                                        </div>

                                        <div class="text-slate-900 font-extrabold text-lg sm:text-xl tabular-nums">
                                            {section.highlight.time}
                                        </div>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>

                <div class="mt-8 text-center space-y-3">
                    {#if previous.greeting}
                        <p class="font-semibold text-slate-800">
                            {previous.greeting}
                        </p>
                    {/if}

                    {#if previousSignatureLines.length}
                        <div class="space-y-1 text-sm text-slate-700">
                            {#each previousSignatureLines as line (line)}
                                <p>{line}</p>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        </article>
    {/if}
</section>