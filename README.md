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

### 5. CMS Configuration (Built-in CMS)
Copy `.env.example` to `.env` and adjust if needed:

```bash
cp .env.example .env
```

The app uses an internal CMS API (`/api/content`) backed by `data/cms.json`.
Use `/admin` to manage content through the built-in editor UI.

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
## 🛠️ Running the built-in CMS (no WordPress dependency)

The project now includes a built-in JSON CMS with admin UI at `/admin`.

### Admin login
Set credentials in your environment (optional, defaults shown):

```bash
CMS_ADMIN_USER=admin
CMS_ADMIN_PASSWORD=admin123
```

Then open: `https://<your-domain>/admin`

From there non-technical users can add/edit/delete:
- Events
- Gallery images

### Data storage
CMS content is stored in: `data/cms.json`.

### Seed data from current website
To import existing posts/media from gv-hellas WordPress REST into the new CMS store:

```bash
npm run seed:cms
```

This writes records into `data/cms.json` and keeps links/businesses from existing data.
