---
name: app-icons
description: Generate or update the Prode Mundial 2026 app icons, logos, favicon, PWA/manifest icons, and social (OG/Twitter) images. Use when the user wants to change the logo/mark, brand colors, favicon, app icon, or share image. All icons are code-generated via Next.js file conventions + next/og — no external rasterizer or binary assets needed.
---

# Prode Mundial 2026 — icon & logo system

Everything brand-visual is **code-generated** at build time. There are no binary
PNG/ICO assets to maintain. To change any icon, edit one source of truth and
rebuild.

## Single source of truth

`src/lib/brand.ts`
- `BRAND` — the palette as hex (mirrors `globals.css` oklch tokens). Use hex here:
  Satori/`next/og` does not reliably parse `oklch()`.
  - cream `#F2E9D0` · ink `#26221B` · red `#B8402B` · gold `#D8A93C` · grass `#2F6B49`
- `tileSvg()` — the mark as an SVG string: brick-red rounded tile + cream "P"
  (stem rect + bowl circle + red counter circle) + a mustard-gold underline.
  **Rects + circles only — no `<text>`** so it rasterizes without a font.
- `tileDataUri()` — base64 data URI of `tileSvg()` for `<img src>` inside `ImageResponse`.

The mark geometry (viewBox `0 0 64 64`): stem `x19 y12 w10 h38`, bowl `cx34 cy24 r15`,
counter `cx37 cy24 r6` (filled red to punch the hole), underline `x16 y49 w32 h5`.

## The files (Next 16 metadata conventions)

| File | Output | Notes |
| --- | --- | --- |
| `src/app/icon.svg` | favicon | Static SVG = `tileSvg()` literal. Keep it in sync with `brand.ts`. |
| `src/app/apple-icon.tsx` | `/apple-icon` 180×180 PNG | Red field + centred mark. iOS rounds corners. |
| `src/app/icons/app/route.tsx` | `/icons/app` 512×512 PNG | Maskable PWA icon (mark in inner ~60% safe area). |
| `src/app/manifest.ts` | `/manifest.webmanifest` | Names, colors, references `icon.svg` + `/icons/app`. |
| `src/app/opengraph-image.tsx` | `/opengraph-image` 1200×630 | Social card. Loads Fraunces via `loadFont()` with default-font fallback. |
| `src/app/twitter-image.tsx` | `/twitter-image` | Re-exports the OG image. |
| `src/components/retro/brand-logo.tsx` | `<BrandLogo>` | In-app lockup (inline SVG mark + "PRODE '26" wordmark). Used in nav, login. |

## How to change things

- **Recolor / reshape the mark:** edit `BRAND` and/or the geometry in
  `tileSvg()` (`src/lib/brand.ts`), then mirror the same shapes into
  `src/app/icon.svg` and `src/components/retro/brand-logo.tsx` (both inline the
  SVG so they don't pull `Buffer` into the client bundle).
- **Change names/PWA colors:** edit `src/app/manifest.ts`.
- **Change the share image text/layout:** edit `src/app/opengraph-image.tsx`.
- **Site metadata** (title, openGraph, metadataBase): `src/app/layout.tsx`.

## Constraints / gotchas

- In `next/og` JSX, every element with children needs `display: "flex"`, and use
  **hex colors only** (no `oklch`).
- Keep the mark `<text>`-free so it never depends on a loaded font.
- `loadFont()` uses an old User-Agent so Google returns a static TTF (Satori
  cannot parse woff2). It must stay wrapped in try/catch.
- Don't add a `favicon.ico` — `icon.svg` is the favicon; a `.ico` would override it.

## Verify

```bash
pnpm build   # all *image* routes generate at build; failures surface here
```
Then check `/icon.svg`, `/apple-icon`, `/icons/app`, `/opengraph-image`,
`/manifest.webmanifest` on the running app.
