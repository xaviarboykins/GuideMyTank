import Link from "next/link";

const adminLinks = [
  ["Dashboard", "/admin"],
  ["Content", "/admin/content"],
  ["Care Guides", "/admin/care-guides"],
  ["Articles", "/admin/articles"],
  ["Categories", "/admin/categories"],
  ["Tags", "/admin/tags"],
  ["Images", "/admin/images"],
  ["Sources", "/admin/sources"],
] as const;

export function AdminNav() {
  return (
    <nav aria-label="Admin navigation" className="flex flex-wrap gap-1">
      {adminLinks.map(([label, href]) => (
        <Link key={href} href={href} className="border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
          {label}
        </Link>
      ))}
    </nav>
  );
}
