import { ImageResponse } from "next/og";

export const alt = "SyntaVera — Ingeniería de inteligencia artificial aplicada";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0C0F12", color: "#F2F4F5", padding: "72px 82px", fontFamily: "serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 34 }}><span style={{ width: 42, height: 42, display: "flex", border: "2px solid #9CC3D4", alignItems: "center", justifyContent: "center", color: "#9CC3D4" }}>SV</span>SyntaVera</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}><div style={{ color: "#9CC3D4", fontFamily: "monospace", fontSize: 20, letterSpacing: 3, textTransform: "uppercase" }}>Ingeniería de IA aplicada</div><div style={{ fontSize: 66, maxWidth: 940, lineHeight: 1.08 }}>Problemas reales. Sistemas que puedes ver, probar y evaluar.</div></div>
      <div style={{ display: "flex", justifyContent: "space-between", color: "#B6BEC2", fontFamily: "monospace", fontSize: 18 }}><span>syntavera.dev</span><span>ECUADOR · LATAM</span></div>
    </div>,
    size,
  );
}
