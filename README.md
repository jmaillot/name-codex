# Name Codex

Naming Governance App — Microsoft 365 & Azure naming standards builder.

A single-page app that helps define and govern naming conventions for Azure, Microsoft 365, Intune, Defender, Exchange and Groups resources. It provides a segment-based builder, live preview, validation rules, a governance score and generated documentation.

## Features

- Segment-based naming builder (fixed, locked, recommended and custom segments)
- Live name preview with validation (length, allowed characters, required segments)
- Governance score and per-rule check list
- Copy to clipboard, favorites and history (localStorage)
- Generated Markdown documentation and segment value dictionary
- Rules, segment libraries and generators defined as JSON data under `src/data`, `src/rules`

## Getting started

```bash
npm install
npm run dev
```

## Scripts

| Script          | Description                       |
| --------------- | --------------------------------- |
| `npm run dev`   | Start the Vite dev server         |
| `npm run build` | Type-check and build for production |
| `npm run lint`  | Run oxlint                        |
| `npm run preview` | Preview the production build    |

## Deployment (GitHub Pages)

The repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds the app and publishes it to GitHub Pages on every push to `main`.

Requirements:

- `base: './'` is already set in `vite.config.ts` so asset paths are relative.
- In GitHub: **Settings → Pages → Source → GitHub Actions**.

To build locally:

```bash
npm run build
npm run preview
```