import Link from "next/link";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
  { href: "/affiliate-disclosure", label: "Affiliate Disclosure" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/admin", label: "Admin Portal" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>© 2026 GuideMyTank</p>

        <nav aria-label="Footer navigation" className="flex flex-wrap gap-4">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                link.href === "/admin"
                  ? "rounded-md bg-black px-3 py-1 text-xs font-medium text-white hover:bg-black/80"
                  : "hover:text-foreground"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
