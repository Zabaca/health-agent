import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Veladon — Your medical record. Yours.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FBFAF7",
          color: "#2D2C25",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px 96px",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            fontSize: 28,
            color: "#6B6759",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 56,
              height: 56,
              background: "#3D8A5A",
              borderRadius: 12,
            }}
          />
          <div style={{ display: "flex" }}>Veladon · Personal health record storage</div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 108,
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
              fontWeight: 500,
              maxWidth: 980,
            }}
          >
            <span>Your medical record</span>
            <span style={{ color: "#C9572D" }}>.</span>
            <span>&nbsp;Yours</span>
            <span style={{ color: "#C9572D" }}>.</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 32,
              lineHeight: 1.4,
              color: "#6B6759",
              maxWidth: 900,
              fontFamily: "Georgia, serif",
            }}
          >
            Request your medical records from any provider, organize them in one app,
            share them on your terms.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 24,
            color: "#6B6759",
          }}
        >
          <div style={{ display: "flex" }}>www.veladon.com</div>
          <div style={{ display: "flex" }}>A Zabaca product</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
