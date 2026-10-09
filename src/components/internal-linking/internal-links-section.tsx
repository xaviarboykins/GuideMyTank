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
    <section className="mt-10 border-y border-border py-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      ) : null}
      <ul className="mt-4 divide-y divide-border border-y border-border">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="grid gap-1 py-3 underline-offset-4 hover:underline sm:grid-cols-[minmax(12rem,0.8fr)_minmax(0,1.4fr)] sm:gap-6"
            >
              <span className="font-semibold">{item.title}</span>
              {item.description ? (
                <span className="line-clamp-2 text-sm leading-5 text-muted-foreground">
                  {item.description.replaceAll(/\s+/g, " ").trim()}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
