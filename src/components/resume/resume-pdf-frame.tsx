"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function ResumePdfFrame({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [numPages, setNumPages] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const resize = () => setWidth(el.clientWidth);
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pageWidth = width > 0 ? Math.min(width - 16, 900) : undefined;

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-auto bg-[#011627]"
    >
      <Document
        file={src}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        externalLinkTarget="_blank"
        externalLinkRel="noopener noreferrer"
        loading={
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Loading resume…
          </div>
        }
        error={
          <div className="flex h-full items-center justify-center text-xs text-destructive">
            Failed to load resume.
          </div>
        }
        className="flex flex-col items-center gap-4 py-4"
      >
        {Array.from({ length: numPages }, (_, i) => (
          <Page
            key={i + 1}
            pageNumber={i + 1}
            width={pageWidth}
            renderTextLayer
            renderAnnotationLayer
          />
        ))}
      </Document>
    </div>
  );
}
