type ProductRatingProps = {
  value: number | null;
};

function formatGuideRating(value: number | null) {
  return value == null ? "Unrated" : `${value}/5`;
}

export function ProductRating({ value }: ProductRatingProps) {
  const safeRating = value == null ? 0 : Math.min(Math.max(value, 0), 5);

  return (
    <div>
      <div
        className="relative inline-block text-base leading-none"
        aria-label={formatGuideRating(value)}
      >
        <span className="text-muted-foreground" aria-hidden="true">
          ★★★★★
        </span>
        <span
          className="absolute inset-y-0 left-0 overflow-hidden text-amber-500"
          style={{
            width: `${(safeRating / 5) * 100}%`,
          }}
          aria-hidden="true"
        >
          ★★★★★
        </span>
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">
        {formatGuideRating(value)}
      </div>
    </div>
  );
}
