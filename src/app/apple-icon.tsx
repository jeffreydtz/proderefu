import { ImageResponse } from "next/og";
import { BRAND, tileDataUri } from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Apple touch icon: full-bleed brick-red field with the mark centred (iOS adds
// its own corner rounding). The tile's own rounding blends into the field.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND.red,
        }}
      >
        <img src={tileDataUri()} width={132} height={132} alt="" />
      </div>
    ),
    { ...size },
  );
}
