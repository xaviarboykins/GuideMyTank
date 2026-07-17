import type { Metadata } from "next";

import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/admin";

import { logoutAdmin } from "./actions";

export const metadata: Metadata = {
  title: { default: "Admin | GuideMyTank", template: "%s | GuideMyTank Admin" },
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireAdmin();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <header className="border-b border-border pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Internal administration</p>
            <h1 className="mt-1 text-2xl font-bold">GuideMyTank Content</h1>
            <p className="mt-1 text-sm text-muted-foreground">Signed in as {user.email}</p>
          </div>
          <form action={logoutAdmin}>
            <Button type="submit" variant="outline">Sign out</Button>
          </form>
        </div>
        <div className="mt-5"><AdminNav /></div>
      </header>
      <div className="py-6">{children}</div>
    </main>
  );
}

