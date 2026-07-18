"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

export type ArticleGridImage = { id: string; url: string; alt: string; caption: string | null; attribution?: string | null; sourceUrl?: string | null; licenseName?: string | null; licenseUrl?: string | null };

export function ArticleImageFlipbook({ images }: { images: ArticleGridImage[] }) {
  const [active, setActive] = useState(0);
  if (!images.length) return null;
  const image = images[active];
  return <section aria-label="Article image flipbook" style={{ width: "100%", maxWidth: "62rem", marginInline: "auto", border: "1px solid var(--border)", background: "var(--card)" }}>
    <figure style={{ margin: 0 }}>
      <img src={image.url} alt={image.alt} style={{ display: "block", width: "100%", height: "min(52vw, 30rem)", minHeight: "18rem", objectFit: "cover", background: "var(--muted)" }} />
      <figcaption style={{ minHeight: "3rem", padding: "0.75rem 1rem", borderTop: "1px solid var(--border)", color: "var(--muted-foreground)", fontSize: "0.875rem", lineHeight: 1.4 }}>{image.caption ?? image.alt}</figcaption>
      {image.attribution || image.licenseName ? <p style={{ margin: 0, padding: "0 1rem 0.75rem", color: "var(--muted-foreground)", fontSize: "0.75rem" }}>Image: {image.sourceUrl && image.attribution ? <a href={image.sourceUrl} target="_blank" rel="noreferrer">{image.attribution}</a> : image.attribution ?? "Source credited"}{image.licenseName ? <> · {image.licenseUrl ? <a href={image.licenseUrl} target="_blank" rel="noreferrer">{image.licenseName}</a> : image.licenseName}</> : null}</p> : null}
    </figure>
    {images.length > 1 ? <div aria-label={`Image ${active + 1} of ${images.length}`} style={{ display: "flex", gap: "0.5rem", overflowX: "auto", padding: "0.75rem", borderTop: "1px solid var(--border)" }}>
      {images.map((item, index) => <button key={item.id} type="button" onClick={() => setActive(index)} aria-label={`Show image ${index + 1}: ${item.alt}`} aria-current={index === active ? "true" : undefined} style={{ flex: "0 0 6rem", padding: 0, border: index === active ? "3px solid var(--foreground)" : "1px solid var(--border)", background: "var(--muted)", cursor: "pointer" }}><img src={item.url} alt="" style={{ display: "block", width: "100%", aspectRatio: "4 / 3", objectFit: "cover" }} /></button>)}
    </div> : null}
  </section>;
}
