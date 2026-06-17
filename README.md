# GV Hellas Svelte Website

This repository contains a modern **SvelteKit** implementation of the GV Hellas association website. It has been fully upgraded to **Svelte 5**, **Vite 7**, and **Tailwind CSS v4** to ensure maximum performance, maintainability, and accessibility.

The project mirrors the structure of the existing WordPress site ([gv-hellas.ch](https://gv-hellas.ch)) while providing a lightning-fast frontend with a headless CMS backend.

## TODO

-[ ] Main: Logo Decide on a modernization
-[ ] Main: Active color seems washed out
-[ ] Main: buttons appear washed out and only on hover show better
-[ ] Main: cursor pointer when hovering over all buttons and links
-[ ] Add: CMS/Businesses
-[ ] CMS/Links: Add description
-[ ] CMS/Links: Logo displayed incorrectly + submit button seems always disabled
-[ ] Check content licences
-[ ] Events-first landing page
-[ ] from Nov.2019: X years
-[ ] FB Api: fetch FB posts
-[ ] Event Registration
-[ ] Content for Equipment Rentals
-[ ] GA4 Integration

## TODO (later)
-[ ] Payment gateway
-[ ] San Simera
-[ ] Cooking recipes

## 🚀 Key Features

* **Svelte 5 Runes** – Leverages `$state`, `$derived`, and `$props` for modern, efficient reactivity.
* **Tailwind CSS v4** – Powered by the new "Oxide" engine with CSS-first theme configuration.
* **Full i18n Support** – Integrated Greek (el) and German (de) localization via `svelte-i18n`.
* **Accessibility First** – Compliant with modern a11y standards (form labels, media captions, and semantic HTML).
* **CMS Abstraction** – Clean data fetching layer in `src/lib/cms.js`, allowing for easy integration with any headless CMS (Sanity, Strapi, etc.).
* **Responsive Design** – A mobile-first, fluid layout designed for all devices.

## 🛠️ Getting Started

### 1. Install Dependencies
We recommend using **pnpm** for this project.

```bash
pnpm install
```

### 2. Synchronize Types
Generate the SvelteKit-specific TypeScript definitions for IDE support:

```bash
pnpm svelte-kit sync
```

### 3. Development Server
Launch the development environment with hot-module replacement:

```bash
pnpm dev
```

### 4. Build for Production
```bash
pnpm build
pnpm preview
```

### 5. CMS Configuration (Built-in DB CMS)
Copy `.env.example` to `.env` and adjust if needed:

```bash
cp .env.example .env
```

The app uses internal CMS APIs (`/api/content`) with data persisted in a local SQLite database (`data/cms.db`).

### 6. Admin UI
Open:

```
https://<your-domain>/admin
```

Login using:
- `CMS_ADMIN_USER`
- `CMS_ADMIN_PASSWORD`

Admin sections:
- `/admin/events` (index table, create, edit, delete)
- `/admin/gallery` (index table, create, edit, delete, tags)

### 7. Seed from current website + image variants
Fetch data from current WordPress site, download images locally, and generate JPG/WEBP responsive variants:

```bash
npm run seed:cms
```

This stores image files under `static/uploads` and updates `data/cms.json`.

### 8. Import CMS JSON into DB
Populate DB tables from `data/cms.json`:

```bash
npm run db:import-json
```

### 9. Optional Docker database stack
A dedicated DB stack is provided for local environments that already run multiple dockerized websites:

```bash
docker compose -f docker-compose.cms-db.yml up -d
```

- Postgres: `localhost:55432`
- PgAdmin: `http://localhost:58080`

Uses named volume: `gv_hellas_pg_data`.

## 🎨 Theme Configuration

Tailwind CSS v4 configuration is handled directly in `src/app.css`. We use CSS variables within the `@theme` block to manage the association's branding:

```css
@theme {
  --color-primary: #005fa3;
  --color-primary-light: #0078bd;
  --color-primary-dark: #004680;
  
  --color-secondary: #e5e5e5;
  --color-secondary-light: #f0f0f0;
  --color-secondary-dark: #d4d4d4;
}
```

## 🌍 Localization

UI strings are managed in `src/lib/i18n.js`. Components use the `$t` store for translations.

**Example Usage in Svelte 5:**

```svelte
<script>
  import { t } from '$lib/i18n';
</script>

<h1>{$t('home.welcomeTitle')}</h1>
```

## 🏗️ Project Structure

* **/src/routes** – Contains the application pages and SvelteKit routing logic.
* **/src/lib/components** – Reusable UI components (Nav, Footer, Slider, EventCard).
* **/src/lib/cms.js** – The data interface for fetching content.
* **/src/lib/i18n.js** – Localization dictionaries and configuration.

## ⚖️ Disclaimer

This project is a modern skeleton designed for migration. While it includes mock data for local development, it is prepared for a production-ready headless CMS integration.
