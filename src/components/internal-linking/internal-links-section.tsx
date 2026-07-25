import Link from "next/link";

import { filterInternalLinkItems } from "../../lib/seo/internal-linking/duplicate-filter";
import type { InternalLinkItem } from "../../lib/seo/internal-linking/types";

interface InternalLinksSectionProps {
  title: string;
  description?: string;
  items: InternalLinkItem[];
  limit?: number;
}

export function InternalLinksSection({
  title,
  description,
  items,
  limit,
}: InternalLinksSectionProps) {
  const links = filterInternalLinkItems(items, { limit });

  if (links.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 rounded-lg border bg-card p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md border border-border p-4 hover:bg-muted/50"
          >
            <h3 className="font-semibold">{item.title}</h3>
            {item.description ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {item.description}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
