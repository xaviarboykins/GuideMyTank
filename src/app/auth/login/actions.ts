"use server";

import { redirect } from "next/navigation";

import { hasAdminRole } from "@/lib/auth/admin-role";
import { createClient } from "@/lib/supabase/server";

export async function loginAdmin(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) redirect("/auth/login?error=missing");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) redirect("/auth/login?error=invalid");
  if (!hasAdminRole(data.user)) {
    await supabase.auth.signOut();
    redirect("/auth/login?error=unauthorized");
  }

  redirect("/admin");
}
