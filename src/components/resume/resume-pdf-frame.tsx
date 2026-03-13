"use client";

import { useRef, useEffect } from "react";

export function ResumePdfFrame({ src }: { src: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const initialLoad = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onLoad = () => {
      if (initialLoad.current) {
        initialLoad.current = false;
        return;
      }
      // iframe navigated away from the PDF — reset it
      initialLoad.current = true;
      el.src = src;
    };

    el.addEventListener("load", onLoad);
    return () => el.removeEventListener("load", onLoad);
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
