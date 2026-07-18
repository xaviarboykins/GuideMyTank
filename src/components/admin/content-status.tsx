export function ContentStatus({ status }: { status: string }) {
  const className = status === "published"
    ? "border-green-700/40 bg-green-500/10 text-green-700 dark:text-green-400"
    : status === "archived"
      ? "border-border bg-muted text-muted-foreground"
      : "border-amber-700/40 bg-amber-500/10 text-amber-700 dark:text-amber-400";

  return <span className={`inline-flex border px-2 py-0.5 text-xs font-medium capitalize ${className}`}>{status}</span>;
}

