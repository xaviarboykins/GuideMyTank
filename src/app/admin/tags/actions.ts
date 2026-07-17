"use server";
import { redirect } from "next/navigation";
import { createArticleTag, deleteArticleTag, updateArticleTag } from "@/lib/taxonomy/service";
import { getSafeContentError } from "@/lib/content/errors";
const value = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
async function run(message: string, operation: () => Promise<unknown>) { try { await operation(); } catch (error) { redirect(`/admin/tags?error=${encodeURIComponent(getSafeContentError(error).message)}`); } redirect(`/admin/tags?saved=${encodeURIComponent(message)}`); }
export async function createTagAction(data: FormData) { return run("Tag created.", () => createArticleTag(value(data, "name"), value(data, "description"))); }
export async function updateTagAction(id: string, data: FormData) { return run("Tag updated.", () => updateArticleTag(id, value(data, "name"), value(data, "slug"), value(data, "description"), data.get("isActive") === "on")); }
export async function deleteTagAction(id: string) { return run("Tag deleted.", () => deleteArticleTag(id)); }
