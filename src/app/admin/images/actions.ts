"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { deleteContentImage, updateContentImage } from "@/lib/content-images/service";
import { getSafeContentError } from "@/lib/content/errors";
const value = (data: FormData, key: string) => String(data.get(key) ?? "").trim() || null;
async function run(message: string, operation: () => Promise<unknown>) { try { await operation(); } catch (error) { redirect(`/admin/images?error=${encodeURIComponent(getSafeContentError(error).message)}`); } revalidatePath("/admin/images"); redirect(`/admin/images?saved=${encodeURIComponent(message)}`); }
export async function updateImageAction(id: string, data: FormData) { return run("Image metadata updated.", () => updateContentImage(id, { alt_text: value(data, "altText"), caption: value(data, "caption"), attribution: value(data, "attribution"), author: value(data, "author"), source_url: value(data, "sourceUrl"), license_name: value(data, "licenseName"), license_url: value(data, "licenseUrl") })); }
export async function deleteImageAction(id: string) { return run("Unused image deleted from metadata and storage.", () => deleteContentImage(id)); }
