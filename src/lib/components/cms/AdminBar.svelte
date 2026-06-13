<script lang="ts">
    import {page} from "$app/state";
    import {t} from "$lib/i18n";

    const items = [
        {href: "/admin/events", labelKey: "nav.events"},
        {href: "/admin/links", labelKey: "nav.links"},
        // { href: "/admin/sponsors", labelKey: "nav.sponsors" },
    ];

    function isActive(href: string) {
        if (href === "/admin") {
            return page.url.pathname === "/admin";
        }
        return page.url.pathname.startsWith(href);
    }

    function itemClass(href: string) {
        return [
            "whitespace-nowrap rounded-md px-3 py-1.5 transition hover:bg-white/10",
            isActive(href) ? "bg-white/15 text-white font-bold" : "text-white/80"
        ].join(" ");
    }
</script>

<div class="sticky top-26 z-10 w-full border-b border-white/10 bg-[hsl(var(--admin))] text-[hsl(var(--admin-foreground))]">
    <div class="mx-auto flex h-12 max-w-7xl items-center gap-6 px-4">
        <div class="shrink-0 text-sm font-bold tracking-[0.18em]">
            {$t("admin.label")} ⚡
        </div>

        <nav class="flex items-center gap-1 overflow-x-auto text-sm">
            {#each items as item}
                <a href={item.href} class={itemClass(item.href)}>
                    {$t(item.labelKey)}
                </a>
            {/each}
        </nav>
    </div>
</div>