import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function Navbar() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        {/* Logo / Brand */}
        <Link href="/" className="shrink-0">
          <span className="text-lg font-bold tracking-tight">GuideMyTank</span>
        </Link>

        {/* Search */}
        <div className="flex-1">
          <Input
            placeholder="Search fish, plants, tank mates..."
            className="w-full"
          />
        </div>

        {/* Navigation */}
        <nav className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" asChild>
            <Link href="/aquadex">AquaDex</Link>
          </Button>

          <Button variant="ghost" asChild>
            <Link href="/compatibility">Compatibility</Link>
          </Button>

          <Button variant="ghost" asChild>
            <Link href="/stocking">Stocking</Link>
          </Button>
        </nav>

        <ThemeToggle />
      </div>
    </header>
  );
}
