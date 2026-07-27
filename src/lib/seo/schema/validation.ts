export function cleanText(value: string | null | undefined) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

export function cleanStringList(
  values: readonly string[] | null | undefined,
) {
  if (!values) return [];

  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

export function isAbsoluteHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function isValidId(value: string) {
  return isAbsoluteHttpUrl(value) && new URL(value).hash.length > 1;
}

export function cleanIsoDate(value: string | null | undefined) {
  const cleaned = cleanText(value);
  if (!cleaned || Number.isNaN(Date.parse(cleaned))) return null;
  return cleaned;
}
