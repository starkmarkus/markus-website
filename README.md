# MarkOS Website

Desktop-inspired portfolio website for Markus Stark.

This repository is public as a showcase of the frontend, interaction design, and small server-side contact form used by the live site.

Live site: https://markusstark.com

## What It Includes

- Responsive single-page portfolio experience
- Desktop-style project browser and window interactions
- Interactive chess and snake modules
- Contact form with validation, honeypot spam handling, and Resend delivery
- Static asset pipeline served by a small Node.js server
- Node test coverage for contact form behavior and game logic

## Tech Stack

- HTML, CSS, and modern JavaScript
- Node.js ESM server
- Vercel Functions-compatible contact endpoint
- Stockfish-powered chess analysis
- Node's built-in test runner

## Local Development

```bash
npm install
npm run dev
```

The local server runs on port `3000` by default.

## Tests

```bash
npm test
```

## Contact Form Setup

The contact form posts to `/api/contact` and sends submissions to the configured recipient address.

Set these Vercel environment variables before deploying:

- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL`
- `CONTACT_FROM_EMAIL` for example `MarkOS Contact <hello@markusstark.com>`

If `CONTACT_FROM_EMAIL` is omitted, the code falls back to `onboarding@resend.dev` for testing.

## Public Repository Notes

- No production API keys or local `.env` files are committed.
- The contact recipient is configured through `CONTACT_TO_EMAIL`, not hardcoded.
- This repository is source-available for portfolio review, not published as an open-source starter.
- Third-party assets and engines keep their own upstream licenses; see `THIRD_PARTY_NOTICES.md`.

## License

The original website code, copy, and brand assets are copyright Markus Stark. See `LICENSE.md`.
