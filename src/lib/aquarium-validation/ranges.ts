export interface NumericRange {
  minimum: number;
  maximum: number;
}

export interface SharedRangeAnalysis<T> {
  completeItems: T[];
  missingItems: T[];
  sharedMinimum: number | null;
  sharedMaximum: number | null;
  hasOverlap: boolean | null;
}

export function toNumericRange(
  minimum: number | null | undefined,
  maximum: number | null | undefined,
): NumericRange | null {
  if (
    minimum == null ||
    maximum == null ||
    !Number.isFinite(minimum) ||
    !Number.isFinite(maximum) ||
    minimum > maximum
  ) {
    return null;
  }

  return { minimum, maximum };
}

export function analyzeSharedRange<T>(
  items: readonly T[],
  getRange: (item: T) => NumericRange | null,
): SharedRangeAnalysis<T> {
  const completeEntries = items.flatMap((item) => {
    const range = getRange(item);
    return range ? [{ item, range }] : [];
  });
  const completeItemSet = new Set(completeEntries.map((entry) => entry.item));
  const missingItems = items.filter((item) => !completeItemSet.has(item));

  if (completeEntries.length === 0) {
    return {
      completeItems: [],
      missingItems,
      sharedMinimum: null,
      sharedMaximum: null,
      hasOverlap: null,
    };
  }

  const sharedMinimum = Math.max(
    ...completeEntries.map((entry) => entry.range.minimum),
  );
  const sharedMaximum = Math.min(
    ...completeEntries.map((entry) => entry.range.maximum),
  );

  return {
    completeItems: completeEntries.map((entry) => entry.item),
    missingItems,
    sharedMinimum,
    sharedMaximum,
    hasOverlap: sharedMinimum <= sharedMaximum,
  };
}
