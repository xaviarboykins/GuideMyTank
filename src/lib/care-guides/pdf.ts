import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Json } from "@/types/database.types";

type PdfGuide = {
  title: string | null; summary: string | null; quick_facts: Json; published_at: string | null; updated_at: string;
  species: { common_name: string; scientific_name: string };
};
type PdfSection = { heading: string | null; section_type: string; content: Json };
type PdfSource = { sources: { title: string; url: string | null; author: string | null; publisher: string | null } };
type PdfImage = { bytes: Uint8Array; caption?: string | null };

const PAGE = { width: 612, height: 792, margin: 54 };

function ascii(value: string) { return value.replace(/[–—]/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^ -~\n]/g, ""); }
function textValue(content: Json) { return typeof content === "object" && content !== null && !Array.isArray(content) && typeof content.text === "string" ? content.text : ""; }
function wrap(text: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = [];
  for (const paragraph of ascii(text).split(/\r?\n/)) {
    const words = paragraph.split(/\s+/).filter(Boolean); let line = "";
    for (const word of words) { const candidate = line ? `${line} ${word}` : word; if (font.widthOfTextAtSize(candidate, size) <= width) line = candidate; else { if (line) lines.push(line); line = word; } }
    lines.push(line);
  }
  return lines;
}

export async function createCareGuidePdf(guide: PdfGuide, sections: PdfSection[], sources: PdfSource[], mainImage?: PdfImage) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica); const bold = await pdf.embedFont(StandardFonts.HelveticaBold); const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
  let page!: PDFPage; let y = PAGE.height - PAGE.margin;
  const addPage = () => { page = pdf.addPage([PAGE.width, PAGE.height]); y = PAGE.height - PAGE.margin; page.drawText("GuideMyTank Care Guide", { x: PAGE.margin, y: 28, size: 8, font: regular, color: rgb(.38, .38, .38) }); };
  const ensure = (height: number) => { if (y - height < PAGE.margin) addPage(); };
  const drawLines = (value: string, font = regular, size = 10.5, gap = 15, indent = 0) => { const lines = wrap(value, font, size, PAGE.width - PAGE.margin * 2 - indent); ensure(lines.length * gap); for (const line of lines) { if (line) page.drawText(line, { x: PAGE.margin + indent, y, size, font, color: rgb(.08, .08, .08) }); y -= gap; } y -= 4; };
  const heading = (value: string) => { ensure(140); y -= 7; drawLines(value, bold, 15, 19); };
  addPage();
  drawLines(guide.title ?? `${guide.species.common_name} Care Guide`, bold, 24, 29);
  drawLines(guide.species.scientific_name, italic, 12, 17); y -= 4;
  if (guide.summary) drawLines(guide.summary, regular, 11, 16);
  drawLines(`Updated ${new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(guide.updated_at))}`, regular, 8.5, 12);
  if (mainImage) {
    const embedded = await pdf.embedPng(mainImage.bytes);
    const availableWidth = PAGE.width - PAGE.margin * 2;
    const scale = Math.min(availableWidth / embedded.width, 250 / embedded.height, 1);
    const width = embedded.width * scale; const height = embedded.height * scale;
    ensure(height + (mainImage.caption ? 32 : 18));
    page.drawImage(embedded, { x: PAGE.margin, y: y - height, width, height }); y -= height + 8;
    if (mainImage.caption) drawLines(mainImage.caption, italic, 8.5, 12);
    else y -= 8;
  }
  const facts = typeof guide.quick_facts === "object" && guide.quick_facts !== null && !Array.isArray(guide.quick_facts) ? Object.entries(guide.quick_facts) : [];
  if (facts.length) { heading("Quick facts"); for (const [key, value] of facts) if (typeof value === "string" || typeof value === "number") drawLines(`${key.replaceAll("_", " ")}: ${value}`, regular, 9.5, 13); }
  for (const section of sections) { const value = textValue(section.content); if (!value) continue; heading(section.heading ?? section.section_type.replaceAll("_", " ")); drawLines(value); }
  if (sources.length) { heading("Sources and references"); sources.forEach((item, index) => drawLines(`${index + 1}. ${item.sources.title}${item.sources.author ? ` - ${item.sources.author}` : ""}${item.sources.publisher ? `, ${item.sources.publisher}` : ""}${item.sources.url ? `\n${item.sources.url}` : ""}`, regular, 8.5, 12)); }
  const pages = pdf.getPages(); pages.forEach((item, index) => item.drawText(`${index + 1} / ${pages.length}`, { x: PAGE.width - PAGE.margin - 24, y: 28, size: 8, font: regular, color: rgb(.38, .38, .38) }));
  pdf.setTitle(guide.title ?? `${guide.species.common_name} Care Guide`); pdf.setAuthor("GuideMyTank Editorial Team"); pdf.setSubject(`Aquarium care guide for ${guide.species.common_name}`);
  return pdf.save();
}
