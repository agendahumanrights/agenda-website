import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const alt = "Human Rights Agenda";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Branded social sharing image (logo + site name on brand blue). */
export default async function OpenGraphImage() {
  const logoBytes = await readFile(
    join(process.cwd(), "public/images/brand/agenda-logo.png"),
  );
  const logoSrc = `data:image/png;base64,${logoBytes.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(155deg, #032a54 0%, #05498c 48%, #0a5aa8 100%)",
          color: "white",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "white",
            borderRadius: 28,
            padding: 28,
            marginBottom: 36,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} height={148} alt="" />
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: -1,
            textAlign: "center",
            padding: "0 64px",
          }}
        >
          Human Rights Agenda
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 28,
            opacity: 0.9,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          humanrightsagenda.org
        </div>
      </div>
    ),
    { ...size },
  );
}
