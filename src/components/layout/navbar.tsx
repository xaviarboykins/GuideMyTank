import Link from "next/link";

import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";

const navLinks = [
  {
    href: "/care-guides",
    label: "Care Guides",
  },
  {
    href: "/compatibility",
    label: "Compatibility",
  },
  {
    href: "/learning-center",
    label: "Learning Center",
  },
  {
    href: "/products",
    label: "Products",
  },
  {
    href: "/aquarium-builder",
    label: "Aquarium Builder",
    primary: true,
  },
];

export function Navbar() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        {/* Brand */}
        <Link href="/" className="shrink-0">
          <span className="text-lg font-bold tracking-tight">GuideMyTank</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="ml-auto hidden items-center gap-2 md:flex">
          {navLinks.map((link) => (
            <Button
              key={link.href}
              variant={link.primary ? "default" : "ghost"}
              asChild
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>

        {/* Mobile Actions */}
        <MobileNav links={navLinks} />
      </div>
    </header>
  );
}
