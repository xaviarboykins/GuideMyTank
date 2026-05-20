import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";

export default function NotFound() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="404"
        title="Page not found"
        description="The aquarium tool or species page you are looking for does not exist yet."
      />

      <div className="mt-6">
        <Button asChild>
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </PageContainer>
  );
}
