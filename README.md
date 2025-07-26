# Cribb Frontend

Cribb is an open-source roommate-management platform that helps apartment groups coordinate **chores**, **shared pantry inventory**, and **shopping lists** in one place.  

This repository contains the **mobile-first Angular&nbsp;19** client.

> The REST API lives in `/CribbBackend` and is written in Go 1.23.

---

## UI Feature Highlights

* 🗂 **Dashboard-first** interface showing upcoming chores, low-stock pantry items, and group activity at a glance.
* 📱 **Mobile-first, responsive** layout powered by Tailwind CSS – looks great on phones, tablets, and desktops.
* ⏰ **Smart Chore Board** with one-time & recurring chores, auto-rotation, reminders, and gamified leaderboards.
* 📦 **Categorised Pantry** view with consumption tracking, expiry warnings, and low-stock notifications.
* 🛒 **Shared Shopping Cart** that syncs in real-time across housemates and provides an activity feed.
* 🔔 **Notification Center** (dropdown, badge & panel components) for consolidated alerts across the app.
* 🌐 **Instant search & filtering** within chores, pantry items, and shopping cart.
* ⚡️ **Offline-friendly PWA** thanks to Angular service-worker caching.

---

## Quick Start

```bash
# 1. install deps
npm install

# 2. start local dev server (http://localhost:4200)
ng serve
```

The client automatically reloads when you edit a source file.

---

## Scripts

| Command                 | Purpose                               |
| ----------------------- | ------------------------------------- |
| `ng serve`              | Development server + live reload      |
| `ng build`              | Production build → `dist/`            |
| `ng test`               | Unit tests with Karma + Jasmine       |
| `ng e2e`                | Cypress end-to-end tests              |
| `npm run lint`          | ESLint over `src/`                    |

---

## Architecture & Key Concepts

| Layer            | Details |
| ---------------- | ------- |
| **Standalone Components** | All feature areas (`chores`, `pantry`, `shopping-cart`, …) are implemented as *standalone* Angular components for faster lazy-loading and simplified module management. |
| **Signals & RxJS** | Some services (e.g. `shopping-cart.service.ts`) use Angular **Signals** for state, while others expose classic RxJS `BehaviorSubject`s. |
| **NgIcons + Iconoir** | Consistent iconography via `@ng-icons/iconoir`; icons are provided locally in each component to keep bundle size low. |
| **Tailwind CSS** | Design system is enforced with Tailwind utility classes plus small SCSS helpers. |
| **Cypress** | End-to-end flows are covered by Cypress specs in `cypress/`. |

---

## Environments

API calls default to `http://localhost:8080`. Override using **environment files** in `src/environments/` or by setting `NG_APP_API_URL` when deploying.

---

## Code Scaffolding

```bash
ng generate component feature/MyAwesomeCmp         # standalone by default
ng generate service  services/my-awesome           # providedIn:'root'
```

Use `ng generate --help` for the full schematic list.

---

## Build & Deploy

1. `ng build --configuration production` → static assets in `dist/cribb-frontend/`.
2. Deploy to any static host (e.g. Vercel, Netlify). A ready-made `vercel.json` is included for zero-config Vercel deploys.

---

## Contributing

Pull requests are welcome! Please follow the existing code-style (ESLint + Prettier) and ensure unit tests & Cypress suites pass.

---

## License

Cribb Frontend is released under the **MIT License**. See `LICENSE` for details.
