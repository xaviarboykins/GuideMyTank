import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileNav } from "@/components/layout/mobile-nav";

const navLinks = [
  {
    href: "/piscidex",
    label: "PisciDex",
  },
  {
    href: "/compatibility",
    label: "Compatibility",
  },
  {
    href: "/stocking",
    label: "Stocking",
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

        {/* Search */}
        <div className="hidden flex-1 md:block">
          <Input placeholder="Search fish, plants, tank mates..." />
        </div>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => (
            <Button key={link.href} variant="ghost" asChild>
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
