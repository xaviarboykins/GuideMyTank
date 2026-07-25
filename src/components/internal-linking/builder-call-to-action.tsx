import Link from "next/link";

import type { InternalLinkItem } from "../../lib/seo/internal-linking/types";

export function BuilderCallToAction({
  item,
}: {
  item?: InternalLinkItem;
}) {
  if (!item) {
    return null;
  }

  return (
    <aside className="mt-6 rounded-lg border bg-muted/30 p-6">
      <h2 className="text-lg font-semibold">{item.title}</h2>
      {item.description ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {item.description}
        </p>
      ) : null}
      <Link
        href={item.href}
        className="mt-4 inline-block text-sm font-medium underline-offset-4 hover:underline"
      >
        Open Aquarium Builder
      </Link>
    </aside>
  );
}
