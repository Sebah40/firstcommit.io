"use client";

import { useEffect, useRef } from "react";

export function ResumePdfFrame({ src }: { src: string }) {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;

    const onLoad = () => {
      let currentHref: string | null = null;
      try {
        currentHref = iframe.contentWindow?.location.href ?? null;
      } catch {
        // Cross-origin navigation (e.g. PDF link clicked to external URL).
        // The URL is unreadable due to same-origin policy; reset the frame
        // so the user doesn't see a blocked-frame white page.
        iframe.src = src;
        return;
      }

      if (currentHref === null) return;
      const currentUrl = new URL(currentHref, window.location.origin);
      const originalUrl = new URL(src, window.location.origin);

      if (currentUrl.pathname !== originalUrl.pathname) {
        window.open(currentHref, "_blank", "noopener,noreferrer");
        iframe.src = src;
      }
    };

    iframe.addEventListener("load", onLoad);
    return () => iframe.removeEventListener("load", onLoad);
  }, [src]);

  return (
    <iframe
      ref={ref}
      src={src}
      style={{ width: "100%", height: "100%", border: "none" }}
      title="Resume"
    />
  );
}
