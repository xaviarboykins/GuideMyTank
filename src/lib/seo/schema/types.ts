export type SchemaReference = {
  "@id": string;
};

type IdentifiedEntity = {
  "@id": string;
};

export type OrganizationEntity = IdentifiedEntity & {
  "@type": "Organization";
  name: string;
  url: string;
};

export type WebSiteEntity = IdentifiedEntity & {
  "@type": "WebSite";
  name: string;
  url: string;
  publisher: SchemaReference;
};

export type WebPageEntity = IdentifiedEntity & {
  "@type": "WebPage";
  name: string;
  description: string;
  url: string;
  isPartOf: SchemaReference;
  about?: SchemaReference[];
  dateModified?: string;
};

export type ArticleEntity = IdentifiedEntity & {
  "@type": "Article";
  headline: string;
  description: string;
  url: string;
  mainEntityOfPage: SchemaReference;
  publisher: SchemaReference;
  author?: SchemaReference;
  image?: SchemaReference;
  datePublished?: string;
  dateModified?: string;
  articleSection?: string;
  keywords?: string[];
};

export type BreadcrumbListEntity = IdentifiedEntity & {
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
};

export type FaqPageEntity = IdentifiedEntity & {
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
};

export type ThingEntity = IdentifiedEntity & {
  "@type": "Thing";
  name: string;
  url: string;
  alternateName?: string;
  description?: string;
};

export type CollectionPageEntity = IdentifiedEntity & {
  "@type": "CollectionPage";
  name: string;
  description: string;
  url: string;
  isPartOf: SchemaReference;
  mainEntity?: SchemaReference;
};

export type ItemListEntity = IdentifiedEntity & {
  "@type": "ItemList";
  numberOfItems: number;
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    url: string;
  }>;
};

export type SchemaEntity =
  | OrganizationEntity
  | WebSiteEntity
  | WebPageEntity
  | ArticleEntity
  | BreadcrumbListEntity
  | FaqPageEntity
  | ThingEntity
  | CollectionPageEntity
  | ItemListEntity;

export type SchemaGraph = {
  "@context": "https://schema.org";
  "@graph": SchemaEntity[];
};

export type SchemaEntityInput =
  | SchemaEntity
  | null
  | undefined
  | false
  | readonly SchemaEntityInput[];
