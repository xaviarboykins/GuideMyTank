import { PageContainer } from "@/components/site/page-container";

export default function Loading() {
  return (
    <PageContainer>
      <div className="border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Loading GuideMyTank data...
        </p>
      </div>
    </PageContainer>
  );
}
