# GV Hellas Svelte Website

This repository contains a **SvelteKit** implementation of the GV Hellas association website.  The goal is to mirror the content and structure of the existing WordPress site (https://gv-hellas.ch) in a modern, performant front‑end with a headless CMS backend.  The site supports Greek (`el`) and German (`de`) languages, making it easy for the board and non‑technical members to add and update events, announcements, useful links and more.

## Features

* **Internationalisation (i18n)** – The UI and all content strings can be translated.  A language switcher in the navigation toggles between Greek and German.  Strings are defined centrally in `src/lib/i18n.js`.
* **CMS abstraction** – All data (events, useful links, businesses, gallery items) is fetched through helper functions in `src/lib/cms.js`.  By default these functions return mock data so the site runs even without a backend.  To connect to a real headless CMS (e.g. Sanity, Strapi, Contentful) set the `VITE_CMS_BASE_URL` environment variable and adjust the `fetchFromCMS` helper.
* **Event management** – Events are listed on `/events` and categorised into upcoming and past events based on their date.  Each event has its own detail page at `/events/[slug]`.  Non‑coders can create and update events in the CMS and see them automatically reflected on the site.
* **Dynamic home page** – The home page features a hero slider, an “about” section, previews of the latest events, an activities overview and a sponsor section.  All content is editable via the CMS.
* **Useful links, gallery, businesses** – Separate pages list useful links (`/links`), photos and videos (`/gallery`) and Greek‑speaking businesses/sponsors (`/businesses`).
* **Contact form** – `/contact` contains a simple contact form.  The current implementation shows a thank‑you message after submission; you can hook it up to Formspree or a serverless function by replacing the `handleSubmit` function.
* **Placeholder pages** – `/equipment` and `/church` provide placeholders for equipment rental information and the church schedule.  You can fill these pages with real content as soon as it becomes available.
* **Tailwind CSS** – Styling uses Tailwind for a clean, modern aesthetic.  Colour palettes are defined in `tailwind.config.cjs`.

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

   If you are unable to use npm on your environment (for example, in restricted sandboxes), you can still read and modify the source files.  Deployment will require running `npm install` and `npm run build` on a machine with internet access.

2. **Configure the CMS**

   Choose a headless CMS (Sanity, Strapi, Contentful, etc.) and model your content types:

   * **Event** – fields: `slug`, `title` (per language), `date`, `excerpt` (per language), `image`, `content` (per language).
   * **Useful link** – fields: `name` (per language), `url`.
   * **Business** – fields: `name`, `url` and optional `logo`.
   * **Gallery item** – fields: `type` (`image` or `video`), `src`, `alt`.

   Expose an API endpoint for each content type.  Set `VITE_CMS_BASE_URL` in a `.env` file at the project root to point at your CMS base URL.  Adjust the paths in `src/lib/cms.js` if necessary.

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   Visit `http://localhost:5173` to see the site in action.  Changes to `.svelte`, `.js` and `.css` files will hot‑reload during development.

4. **Build for production**

   ```bash
   npm run build
   npm run preview
   ```

## Translating content

All UI strings live in `src/lib/i18n.js`.  Each key has an `el` and a `de` variant.  When adding new pages or components be sure to add translations for both languages.  Content stored in the CMS should also include translations for every language you support.

## Extending the site

* **Add more languages** – Register new locales in `src/lib/i18n.js` and add translation keys.  Add additional buttons in the navigation bar to switch languages.
* **Add authentication and private pages** – If the association decides to offer member‑only content, integrate an authentication provider (e.g. Clerk or Auth0) and protect certain routes.
* **Integrate payments or ticketing** – For paid events you can integrate Stripe or an event ticketing system.  Extend the CMS schema to include pricing and ticket availability.
* **SEO and metadata** – Use SvelteKit’s `<svelte:head>` to set page‑specific titles, descriptions and social metadata.

## Disclaimer

This skeleton is designed for demonstration purposes and does not include production‑ready error handling, authentication, or backend integration.  However, it provides a solid foundation for migrating the existing GV Hellas WordPress site to a modern SvelteKit front‑end with a headless CMS.  Feel free to customise the design and functionality to suit your association’s needs.