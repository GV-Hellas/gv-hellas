<script>
    import { t } from '$lib/i18n';

    // schedule is a nested object in i18n; svelte-i18n will return it as-is
    $: schedule = $t('church.schedule');
</script>

<section class="space-y-6">
    <header class="space-y-2">
        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            {$t('church.headline')}
        </h1>
        <p class="max-w-2xl text-slate-700">
            {$t('church.description')}
        </p>
    </header>

    <article class="rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur shadow-sm">
        <div class="p-6 sm:p-8">
            <!-- Header block (from the flyer, but styled to your theme) -->
            <div class="relative">
                <div class="float-left text-left space-y-1">
                    <div class="space-y-1">
                        <p class="text-sm sm:text-base font-extrabold tracking-wide text-[color:var(--color-primary-dark)]">
                            {schedule.meta.parishLine1}
                        </p>
                        <p class="text-sm sm:text-base font-extrabold tracking-wide text-[color:var(--color-primary-dark)]">
                            {schedule.meta.parishLine2}
                        </p>
                        <p class="text-sm text-slate-600">
                            ({schedule.meta.address})
                        </p>
                    </div>
                </div>

                <div class="float-right text-right space-y-1 pl-4">
                    <p class="text-xs sm:text-sm font-semibold tracking-wide text-slate-700">
                        {schedule.meta.line1}
                    </p>
                    <p class="text-xs sm:text-sm font-semibold tracking-wide text-slate-700">
                        {schedule.meta.line2}
                    </p>
                </div>

                <div class="clear-both"></div>
            </div>

            <div class="my-6 h-px bg-slate-200/80"></div>

            <!-- Program title -->
            <div class="text-center space-y-1">
                <h2 class="text-lg sm:text-xl font-extrabold text-slate-900">
                    {schedule.program.title}
                </h2>
                <p class="text-sm sm:text-base font-semibold text-slate-700">
                    {schedule.program.subtitle}
                </p>
            </div>

            <!-- Schedule table -->
            <div class="mt-6 overflow-x-auto">
                <table class="min-w-full text-sm">
                    <thead class="text-left text-xs text-gray-400">
                    <tr class="border-b border-slate-200/70">
                        <th class="py-2 pr-4 font-bold uppercase">{schedule.table.date}</th>
                        <th class="py-2 pr-4 font-bold uppercase">{schedule.table.service}</th>
                        <th class="py-2 text-right font-semibold uppercase">{schedule.table.time}</th>
                    </tr>
                    </thead>

                    <tbody class="divide-y divide-slate-200/70">
                    {#each schedule.entries as entry (entry.date + entry.time)}
                        <tr class="align-top">
                            <td class="py-3 pr-4 font-semibold text-slate-900 whitespace-nowrap tabular-nums">
                                {entry.date}
                            </td>
                            <td class="py-3 pr-4 text-slate-800">
                                {entry.service}
                            </td>
                            <td class="py-3 text-right font-semibold text-slate-900 whitespace-nowrap tabular-nums">
                                {entry.time}
                            </td>
                        </tr>
                    {/each}
                    </tbody>
                </table>
            </div>

            <!-- Highlight (Easter night) -->
            <div class="mt-6 rounded-xl border border-slate-200/70 bg-[color:var(--color-secondary-light)] p-4">
                <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div class="space-y-1">
                        <p class="text-sm font-semibold text-slate-900 tabular-nums">
                            {schedule.highlight.date}
                        </p>
                        <p class="text-slate-700">
                            {schedule.highlight.text}
                        </p>
                    </div>

                    <div class="text-slate-900 font-extrabold text-lg sm:text-xl tabular-nums">
                        {schedule.highlight.time}
                    </div>
                </div>
            </div>

            <!-- Greeting + signature -->
            <div class="mt-8 text-center space-y-3">
                <p class="font-semibold text-slate-800">
                    {schedule.greeting}
                </p>

                <div class="space-y-1 text-sm text-slate-700">
                    {#each schedule.signature as line (line)}
                        <p>{line}</p>
                    {/each}
                </div>
            </div>
        </div>
    </article>
</section>