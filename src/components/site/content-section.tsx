type ContentSectionProps = {
  title?: string;
  children: React.ReactNode;
};

export function ContentSection({ title, children }: ContentSectionProps) {
  return (
    <section className="mt-6 border border-border bg-card p-6">
      {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}

      <div className={title ? "mt-4" : undefined}>{children}</div>
    </section>
  );
}
