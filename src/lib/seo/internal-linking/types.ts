import type { ProductCategory } from "../../products/types";
import type {
  CompatibilityResult,
  SpeciesRow,
} from "../../compatibility/types";

export type InternalLinkEntityType =
  | "species"
  | "care-guide"
  | "compatibility-report"
  | "article"
  | "builder"
  | "product-category"
  | "topic-cluster";

export type InternalLinkRelationship =
  | "care-guide"
  | "compatible-species"
  | "incompatible-species"
  | "similar-species"
  | "similar-care"
  | "related-compatibility"
  | "related-content"
  | "topic-cluster"
  | "builder-action"
  | "product-category";

export interface InternalLinkItem {
  entityType: InternalLinkEntityType;
  entityId: string;
  title: string;
  href: string;
  description?: string;
  relationship: InternalLinkRelationship;
  score?: number;
}

export interface InternalLinkPageIdentity {
  entityType: InternalLinkEntityType;
  entityId: string;
  href: string;
}

export type InternalLinkRouteTarget =
  | { entityType: "species"; slug: string }
  | { entityType: "care-guide"; slug: string }
  | {
      entityType: "compatibility-report";
      speciesASlug: string;
      speciesBSlug: string;
    }
  | { entityType: "article"; slug: string }
  | { entityType: "builder" }
  | { entityType: "product-category"; category: ProductCategory }
  | { entityType: "topic-cluster"; hubHref: string };

export interface InternalLinkFilterOptions {
  source?: InternalLinkPageIdentity;
  limit?: number;
}

export type RelatedSpeciesAvailability = "published" | "draft" | "archived";

export interface RelatedSpeciesCandidate {
  species: SpeciesRow;
  availability?: RelatedSpeciesAvailability;
  compatibility?: CompatibilityResult["compatibility"];
  compatibilityScore?: number;
}

export interface RelatedSpeciesRecommendation {
  species: SpeciesRow;
  score: number;
  reasons: string[];
}

export interface RelatedSpeciesGroups {
  commonTankMates: RelatedSpeciesRecommendation[];
  similarSpecies: RelatedSpeciesRecommendation[];
  similarCareRequirements: RelatedSpeciesRecommendation[];
  speciesToAvoid: RelatedSpeciesRecommendation[];
}

export interface RelatedSpeciesOptions {
  limit?: number;
  minimumScore?: number;
}

export interface CompatibilityReportSpecies {
  entityId: string;
  slug: string;
  name: string;
}

export interface CompatibilityReportCandidate {
  speciesA: CompatibilityReportSpecies;
  speciesB: CompatibilityReportSpecies;
  availability?: RelatedSpeciesAvailability;
  score?: number;
}

export interface RelatedCompatibilityOptions {
  limit?: number;
  sharedSpeciesLimit?: number;
}

export interface RelatedContentContext {
  page: InternalLinkPageIdentity;
  speciesEntityIds?: string[];
  speciesSlugs?: string[];
  categorySlugs?: string[];
  tagSlugs?: string[];
}

export interface RelatedContentCandidate {
  entityId: string;
  title: string;
  description?: string;
  target: InternalLinkRouteTarget;
  availability?: RelatedSpeciesAvailability;
  relationship?: InternalLinkRelationship;
  explicitRelationship?: boolean;
  speciesEntityIds?: string[];
  speciesSlugs?: string[];
  categorySlugs?: string[];
  tagSlugs?: string[];
}

export interface RelatedContentOptions {
  limit?: number;
}

export interface TopicClusterMember {
  slug: string;
  title: string;
  description?: string;
}

export interface TopicClusterDefinition {
  slug: string;
  title: string;
  description?: string;
  hub: InternalLinkRouteTarget;
  species?: readonly TopicClusterMember[];
  articles?: readonly TopicClusterMember[];
  careGuides?: readonly TopicClusterMember[];
  compatibilitySpeciesSlugs?: readonly string[];
  productCategories?: readonly ProductCategory[];
}

export interface TopicClusterPageContext {
  entityType: InternalLinkEntityType;
  slug?: string;
  speciesSlugs?: string[];
  categorySlug?: string;
}

export interface TopicClusterAvailability {
  speciesSlugs: ReadonlySet<string>;
  articleSlugs: ReadonlySet<string>;
  careGuideSlugs: ReadonlySet<string>;
  productCategories: ReadonlySet<ProductCategory>;
}
