"use client";

export function ResumePdfFrame({ src }: { src: string }) {
  return (
    <iframe
      src={src}
      style={{ width: "100%", height: "100%", border: "none" }}
      title="Resume"
    />
  );
}
