import { ImageResponse } from "next/og";
import { BRAND, tileDataUri } from "@/lib/brand";

export const alt = "Prode Mundial 2026 — pronósticos, fixture y tabla";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Uses next/og's built-in font (no external font fetch → fully reliable at
// build time). The geometric mark carries the brand identity.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          background: BRAND.cream,
          color: BRAND.ink,
          padding: 72,
          border: `16px solid ${BRAND.ink}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={tileDataUri()} width={108} height={108} alt="" />
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 8,
              fontWeight: 700,
              textTransform: "uppercase",
              color: BRAND.red,
            }}
          >
            Prode · Solo por invitación
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontWeight: 800,
              fontSize: 132,
              lineHeight: 1,
              letterSpacing: -3,
            }}
          >
            Prode Mundial 2026
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 22,
              width: 220,
              height: 14,
              background: BRAND.gold,
              borderRadius: 7,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 40,
            fontWeight: 600,
            color: BRAND.ink,
          }}
        >
          <span style={{ display: "flex" }}>Pronósticos</span>
          <span style={{ display: "flex", color: BRAND.red }}>·</span>
          <span style={{ display: "flex" }}>Fixture</span>
          <span style={{ display: "flex", color: BRAND.red }}>·</span>
          <span style={{ display: "flex" }}>Tabla</span>
          <span style={{ display: "flex", color: BRAND.red }}>·</span>
          <span style={{ display: "flex" }}>Llave</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
