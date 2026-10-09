import type { Json } from "../../types/database.types";

import { isJsonRecord } from "../content/structured-data";

export type CareGuideFaqItem = {
  question: string;
  answer: string;
};

const QUESTION_START = /(?:^|(?<=[.!])\s+|\n\s*)(?=(?:Can|Do|Does|Why|How|What|When|Where|Is|Are|Should|Will)\b)/g;

export function parseLegacyCareGuideFaq(text: string): CareGuideFaqItem[] {
  const normalized = text.replaceAll("\r\n", "\n").trim();
  if (!normalized) return [];

  const starts = [
    ...normalized.matchAll(QUESTION_START),
  ].map((match) => match.index ?? 0);

  if (starts[0] !== 0) starts.unshift(0);

  return starts.flatMap((start, index) => {
    const chunk = normalized.slice(start, starts[index + 1] ?? normalized.length).trim();
    const questionEnd = chunk.indexOf("?");
    if (questionEnd < 1) return [];

    const question = chunk.slice(0, questionEnd + 1).replaceAll(/\s+/g, " ").trim();
    const answer = chunk.slice(questionEnd + 1).replaceAll(/\s+/g, " ").trim();
    return question && answer ? [{ question, answer }] : [];
  });
}

export function getCareGuideFaqItems(content: Json): CareGuideFaqItem[] {
  const record = isJsonRecord(content) ? content : {};

  if (Array.isArray(record.items)) {
    return record.items.flatMap((item) => {
      if (!isJsonRecord(item)) return [];
      const question = typeof item.question === "string" ? item.question.trim() : "";
      const answer = typeof item.answer === "string" ? item.answer.trim() : "";
      return question && answer ? [{ question, answer }] : [];
    });
  }

  return typeof record.text === "string"
    ? parseLegacyCareGuideFaq(record.text)
    : [];
}

export function formatCareGuideFaqForEditing(content: Json) {
  return getCareGuideFaqItems(content)
    .map(({ question, answer }) => `${question}\n${answer}`)
    .join("\n\n");
}
