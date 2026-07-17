import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminUser } from "@/lib/auth/admin";

import { loginAdmin } from "./actions";

export const metadata: Metadata = {
  title: "Admin Login | GuideMyTank",
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  missing: "Enter your email address and password.",
  invalid: "The email address or password was not accepted.",
  unauthorized: "This account does not have administrator access.",
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  if (await getAdminUser()) redirect("/admin");
  const { error } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-16">
      <div className="border border-border bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Internal administration</p>
        <h1 className="mt-2 text-2xl font-bold">GuideMyTank Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in with an authorized administrator account.</p>

        {error ? (
          <p role="alert" className="mt-4 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessages[error] ?? "Sign-in could not be completed."}
          </p>
        ) : null}

        <form action={loginAdmin} className="mt-6 space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Email</span>
            <Input name="email" type="email" autoComplete="email" required />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Password</span>
            <Input name="password" type="password" autoComplete="current-password" required />
          </label>
          <Button type="submit" className="w-full">Sign in</Button>
        </form>
      </div>
    </main>
  );
}

