/* eslint-disable @next/next/no-img-element */
import { isJsonRecord } from "@/lib/content/structured-data";
import type { Json } from "@/types/database.types";

function text(content: Json) {
  return isJsonRecord(content) && typeof content.text === "string" ? content.text : "";
}

export function ArticleBlock({ type, content, imageUrls }: { type: string; content: Json; imageUrls: Map<string, string> }) {
  const record = isJsonRecord(content) ? content : {};
  if (type === "heading") {
    const level = Number(record.level);
    return level === 3 ? <h3 className="text-xl font-semibold">{text(content)}</h3> : level === 4 ? <h4 className="text-lg font-semibold">{text(content)}</h4> : <h2 className="text-2xl font-semibold">{text(content)}</h2>;
  }
  if (["paragraph", "tip", "warning"].includes(type)) return <div className={type === "paragraph" ? "" : `border p-4 ${type === "warning" ? "border-destructive/40 bg-destructive/10" : "border-blue-700/30 bg-blue-500/10"}`}><p className="whitespace-pre-wrap leading-7">{text(content)}</p></div>;
  if (type === "list" && Array.isArray(record.items)) {
    const Tag = record.ordered ? "ol" : "ul";
    return <Tag className={`${record.ordered ? "list-decimal" : "list-disc"} space-y-2 pl-6`}>{record.items.map((item, index) => <li key={index}>{typeof item === "string" ? item : ""}</li>)}</Tag>;
  }
  if (type === "comparison_table" && Array.isArray(record.headers) && Array.isArray(record.rows)) return <div className="overflow-x-auto"><table className="w-full border border-border text-left text-sm"><thead><tr>{record.headers.map((header, index) => <th key={index} className="border border-border bg-muted p-3">{typeof header === "string" ? header : ""}</th>)}</tr></thead><tbody>{record.rows.map((row, rowIndex) => <tr key={rowIndex}>{Array.isArray(row) ? row.map((cell, index) => <td key={index} className="border border-border p-3">{typeof cell === "string" ? cell : ""}</td>) : null}</tr>)}</tbody></table></div>;
  if (type === "faq_group" && Array.isArray(record.items)) return <section className="border border-border"><h2 className="border-b border-border p-4 text-2xl font-semibold">Frequently Asked Questions</h2>{record.items.map((item, index) => isJsonRecord(item) ? <div key={index} className="grid gap-2 border-t border-border p-4 first:border-t-0 md:grid-cols-[1fr_2fr]"><h3 className="font-semibold">{typeof item.question === "string" ? item.question : ""}</h3><p>{typeof item.answer === "string" ? item.answer : ""}</p></div> : null)}</section>;
  if (type === "image" && typeof record.imageId === "string") {
    const url = imageUrls.get(record.imageId);
    return url ? <img src={url} alt={typeof record.alt === "string" ? record.alt : "Content image"} className="max-h-[32rem] w-full object-contain" /> : null;
  }
  return null;
}
