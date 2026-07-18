import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { hasAdminRole } from "./admin-role";

export async function getAdminUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user || !hasAdminRole(data.user)) {
    return null;
  }

  return data.user;
}

export async function requireAdmin() {
  const user = await getAdminUser();

  if (!user) {
    redirect("/auth/login");
  }

  return user;
}

export async function assertAdmin() {
  const user = await getAdminUser();

  if (!user) {
    throw new Error("Unauthorized admin operation.");
  }

  return user;
}
