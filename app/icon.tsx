import { ImageResponse } from "next/og";

// App icon (favicon) generated at build time from JSX.
// See https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0c12",
          color: "#fef3c7",
          fontFamily: "monospace",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: -1,
          border: "2px solid #fef3c7",
          borderRadius: 6,
        }}
      >
        ak
      </div>
    ),
    size
  );
}
