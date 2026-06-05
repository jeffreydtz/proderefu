/**
 * Brand primitives for Prode Mundial 2026 — the retro editorial deportivo mark.
 *
 * The mark is a geometric "P" (stem + bowl + a mustard-gold editorial underline)
 * on a brick-red tile. It is built from rects + circles only (no <text>), so it
 * rasterizes crisply at any size and through `next/og` without loading a font.
 *
 * Palette mirrors the `globals.css` tokens (hex so it's safe in Satori/ImageResponse).
 */
export const BRAND = {
  cream: "#F2E9D0", // paper
  ink: "#26221B", // warm ink
  red: "#B8402B", // brick red (primary)
  gold: "#D8A93C", // mustard gold
  grass: "#2F6B49", // pitch green
} as const;

/** Self-contained tile: brick-red rounded square + cream "P" + gold underline. */
export function tileSvg(): string {
  return [
    `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">`,
    `<rect width="64" height="64" rx="14" fill="${BRAND.red}"/>`,
    `<rect x="19" y="12" width="10" height="38" rx="2" fill="${BRAND.cream}"/>`,
    `<circle cx="34" cy="24" r="15" fill="${BRAND.cream}"/>`,
    `<circle cx="37" cy="24" r="6" fill="${BRAND.red}"/>`,
    `<rect x="16" y="49" width="32" height="5" rx="2.5" fill="${BRAND.gold}"/>`,
    `</svg>`,
  ].join("");
}

/** Base64 data URI of the tile mark — for `<img src>` inside `ImageResponse`. */
export function tileDataUri(): string {
  return `data:image/svg+xml;base64,${Buffer.from(tileSvg()).toString("base64")}`;
}
