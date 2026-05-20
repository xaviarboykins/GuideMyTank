type CompatibilityBadgeProps = {
  compatibility: "compatible" | "caution" | "incompatible" | null;
};

export function CompatibilityBadge({ compatibility }: CompatibilityBadgeProps) {
  const styles: Record<string, string> = {
    compatible:
      "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400",
    caution:
      "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    incompatible:
      "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
  };

  return (
    <span
      className={`rounded-md border px-3 py-1 text-sm font-medium capitalize ${
        styles[compatibility ?? ""] ?? "border-muted bg-muted text-foreground"
      }`}
    >
      {compatibility ?? "Unknown"}
    </span>
  );
}
