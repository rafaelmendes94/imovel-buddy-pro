import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** QR Code renderizado como imagem (compatível com html2canvas / PDF). */
export function QRCodeImg({ value, size = 64, dark = "#071D3B" }: { value: string; size?: number; dark?: string }) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, { margin: 0, width: size * 3, color: { dark, light: "#ffffff" } })
      .then(url => alive && setSrc(url))
      .catch(() => alive && setSrc(""));
    return () => {
      alive = false;
    };
  }, [value, size, dark]);

  if (!src) return <div style={{ width: size, height: size }} />;
  return <img src={src} alt="QR Code" width={size} height={size} style={{ width: size, height: size, display: "block" }} />;
}
