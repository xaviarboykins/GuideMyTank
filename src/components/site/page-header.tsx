import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  badge?: ReactNode;
  action?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  badge,
  action,
}: PageHeaderProps) {
  return (
    <header className="bg-card p-6">
      {eyebrow ? (
        <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
      ) : null}

      <div className="mt-2 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {badge}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      {description ? (
        <p className="mt-4 max-w-3xl text-muted-foreground">{description}</p>
      ) : null}
    </header>
  );
}
