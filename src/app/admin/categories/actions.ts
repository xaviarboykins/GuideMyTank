"use server";
import { redirect } from "next/navigation";
import { createArticleCategory, deleteArticleCategory, updateArticleCategory } from "@/lib/taxonomy/service";
import { getSafeContentError } from "@/lib/content/errors";
const value = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
async function run(message: string, operation: () => Promise<unknown>) { try { await operation(); } catch (error) { redirect(`/admin/categories?error=${encodeURIComponent(getSafeContentError(error).message)}`); } redirect(`/admin/categories?saved=${encodeURIComponent(message)}`); }
export async function createCategoryAction(data: FormData) { return run("Category created.", () => createArticleCategory(value(data, "name"), value(data, "description"))); }
export async function updateCategoryAction(id: string, data: FormData) { return run("Category updated.", () => updateArticleCategory(id, value(data, "name"), value(data, "slug"), value(data, "description"), data.get("isActive") === "on")); }
export async function deleteCategoryAction(id: string) { return run("Category deleted.", () => deleteArticleCategory(id)); }
