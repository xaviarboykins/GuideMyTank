export type SeoHealthSeverity = "error" | "warning";

export type SeoHealthIssue = {
  severity: SeoHealthSeverity;
  category: string;
  urlOrRecord: string;
  description: string;
  suggestedAction: string;
};

export type SeoPageFamilyCounts = Record<string, number>;

export type SeoHealthReport = {
  generatedAt: string;
  summary: {
    totalIndexablePages: number;
    totalSitemapUrls: number;
    totalIssues: number;
    errors: number;
    warnings: number;
  };
  pageFamilies: SeoPageFamilyCounts;
  sitemapFamilies: SeoPageFamilyCounts;
  internalLinks: {
    pages: number;
    links: number;
    issues: number;
    errors: number;
    warnings: number;
    orphanedPages: number;
  };
  issues: SeoHealthIssue[];
};

export type SeoHealthPage = {
  path: string;
  family: string;
  title?: string | null;
  description?: string | null;
  canonical?: string | null;
  indexable: boolean;
  inSitemap: boolean;
  links: string[];
};

export type SeoHealthImage = {
  id: string;
  storagePath: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};
