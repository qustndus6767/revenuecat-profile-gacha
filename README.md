# Steam Profile Customizer (with RevenueCat)

A Vite and React-based B2C prototype for a Steam-style profile customization and merchandise gacha platform. This project integrates the RevenueCat Web SDK to implement real-time user entitlement verification (Free / Master), dynamic global theme switching, and inventory equipment access control (Premium Enforcer).

---

## Key Features

* **Steam-Style Dynamic Profile UI**
  * Built a dark-neon theme UI harmonizing avatars, titles, and rare item borders.
* **RevenueCat Web SDK Integration**
  * Implemented real-time validation of user entitlements using a production-ready in-app purchase and subscription management SDK.
* **Premium Enforcer Pattern**
  * Embedded business logic that blocks users from equipping SSR animated avatars and premium items unless they hold the 'Master' tier, subsequently triggering payment prompt modals.
* **Gacha & Inventory System**
  * Developed a mini-gacha system powered by a virtual drop table alongside a scroll-optimized inventory layout.
* **Sandbox Payment Test Pipeline**
  * Finalized success/failure exception handling workflows using the RevenueCat Sandbox environment and Stripe test cards.

---

## Tech Stacks

* **Frontend**: React, Vite, Tailwind CSS
* **Monetization**: `@revenuecat/purchases-js` (RevenueCat Web SDK)
* **Deployment**: Vercel

---

## Environment Variables

To run this project, create a `.env` file in the root directory and configure the following environment variable:

```text
VITE_REVENUECAT_API_KEY=test_sXcbEEQfdDVRHmFBwjYGjxhnHCr