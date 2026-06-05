import { ImageResponse } from "next/og";
import { BRAND, tileDataUri } from "@/lib/brand";

// 512×512 maskable PWA icon (referenced by app/manifest.ts). The mark sits in
// the inner ~60% so it survives Android's maskable safe-area crop.
export const dynamic = "force-static";

export function GET() {
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={tileDataUri()} width={300} height={300} alt="" />
      </div>
    ),
    { width: 512, height: 512 },
  );
}
