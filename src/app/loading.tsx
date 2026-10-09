import { PageContainer } from "@/components/site/page-container";

export default function Loading() {
  return (
    <PageContainer>
      <div aria-hidden="true" className="animate-pulse space-y-5">
        <div className="h-4 w-40 bg-muted" />
        <div className="h-10 max-w-2xl bg-muted" />
        <div className="h-5 max-w-3xl bg-muted" />
        <div className="grid gap-4 pt-4 sm:grid-cols-2">
          <div className="h-44 border border-border bg-muted/70" />
          <div className="h-44 border border-border bg-muted/70" />
        </div>
      </div>
    </PageContainer>
  );
}
