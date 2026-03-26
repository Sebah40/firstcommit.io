"use client";

export function ResumePdfFrame({ src }: { src: string }) {
  return (
    <iframe
      src={src}
      sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
      style={{ width: "100%", height: "100%", border: "none" }}
      title="Resume"
    />
  );
}
