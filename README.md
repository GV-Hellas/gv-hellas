# GV Hellas Svelte Website

This repository contains a modern **SvelteKit** implementation of the GV Hellas association website. It has been fully upgraded to **Svelte 5**, **Vite 7**, and **Tailwind CSS v4** to ensure maximum performance, maintainability, and accessibility.

The project mirrors the structure of the existing WordPress site ([gv-hellas.ch](https://gv-hellas.ch)) while providing a lightning-fast frontend with a headless CMS backend.

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

### 5. CMS Configuration (WordPress)
Copy `.env.example` to `.env` and adjust if needed:

```bash
cp .env.example .env
```

The app will query `https://gv-hellas.ch/wp-json/wp/v2` by default and gracefully fall back to local seed data when the CMS is unavailable.

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
## 🧩 CMS for non-technical editors (recommended setup)

This project currently uses **WordPress as the CMS** via REST (`/wp-json/wp/v2`).
No new CMS was installed in this repository/container.

For non-technical content editing with a friendly UI, keep using your hosted WordPress admin:

1. Open `https://gv-hellas.ch/wp-admin` and log in.
2. **Events**: create/edit regular Posts (title, excerpt, content, featured image, publish date).
3. **Gallery**: upload/manage images in Media Library.
4. Publish/update entries; Svelte frontend reads them automatically from REST API.

If you want even cleaner editor screens for volunteers, add these WordPress plugins on the hosted site:
- **Custom Post Type UI** (optional `Events`/`Gallery` post types)
- **Advanced Custom Fields (ACF)** (structured event fields)

This keeps CMS + website hosted together and manageable by non-technical users.
