type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="border border-border bg-card p-6">
      {eyebrow ? (
        <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
      ) : null}

      <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>

      {description ? (
        <p className="mt-4 max-w-3xl text-muted-foreground">{description}</p>
      ) : null}
    </header>
  );
}
