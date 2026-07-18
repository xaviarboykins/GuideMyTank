"use server";
import { redirect } from "next/navigation";
import { createSource, deleteSource, updateSource } from "@/lib/content-sources/service";
import { getSafeContentError } from "@/lib/content/errors";
const value = (data: FormData, key: string) => String(data.get(key) ?? "").trim() || null;
const fields = (data: FormData) => ({ title: String(data.get("title") ?? "").trim(), publisher: value(data, "publisher"), author: value(data, "author"), url: value(data, "url"), publication_date: value(data, "publicationDate"), accessed_date: value(data, "accessedDate"), source_type: String(data.get("sourceType") ?? "website"), notes: value(data, "notes") });
async function run(message: string, operation: () => Promise<unknown>) { try { await operation(); } catch (error) { redirect(`/admin/sources?error=${encodeURIComponent(getSafeContentError(error).message)}`); } redirect(`/admin/sources?saved=${encodeURIComponent(message)}`); }
export async function createSourceAction(data: FormData) { return run("Source created.", () => createSource(fields(data))); }
export async function updateSourceAction(id: string, data: FormData) { return run("Source updated.", () => updateSource(id, fields(data))); }
export async function deleteSourceAction(id: string) { return run("Unused source deleted.", () => deleteSource(id)); }
