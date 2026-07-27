import {
  ORGANIZATION_ID,
  WEBSITE_ID,
} from "../identities";
import { getSiteUrl } from "../site-url";

import type {
  ArticleEntity,
  BreadcrumbListEntity,
  CollectionPageEntity,
  FaqPageEntity,
  ItemListEntity,
  OrganizationEntity,
  SchemaReference,
  ThingEntity,
  WebPageEntity,
  WebSiteEntity,
} from "./types";
import {
  cleanIsoDate,
  cleanStringList,
  cleanText,
  isAbsoluteHttpUrl,
  isValidId,
} from "./validation";

export function schemaReference(id: string): SchemaReference | null {
  return isValidId(id) ? { "@id": id } : null;
}

export function buildOrganization(input: {
  id?: string;
  name?: string | null;
  url?: string | null;
} = {}): OrganizationEntity | null {
  const id = input.id ?? ORGANIZATION_ID;
  const name = cleanText(input.name ?? "GuideMyTank");
  const url = input.url ?? getSiteUrl();

  if (!isValidId(id) || !name || !isAbsoluteHttpUrl(url)) return null;

  return { "@type": "Organization", "@id": id, name, url };
}

export function buildWebSite(input: {
  id?: string;
  name?: string | null;
  url?: string | null;
  publisherId?: string;
} = {}): WebSiteEntity | null {
  const id = input.id ?? WEBSITE_ID;
  const name = cleanText(input.name ?? "GuideMyTank");
  const url = input.url ?? getSiteUrl();
  const publisher = schemaReference(input.publisherId ?? ORGANIZATION_ID);

  if (!isValidId(id) || !name || !isAbsoluteHttpUrl(url) || !publisher) {
    return null;
  }

  return { "@type": "WebSite", "@id": id, name, url, publisher };
}

export function buildWebPage(input: {
  id: string;
  name: string | null | undefined;
  description: string | null | undefined;
  url: string;
  websiteId?: string;
  aboutIds?: readonly string[] | null;
  dateModified?: string | null;
}): WebPageEntity | null {
  const name = cleanText(input.name);
  const description = cleanText(input.description);
  const isPartOf = schemaReference(input.websiteId ?? WEBSITE_ID);
  const about = cleanStringList(input.aboutIds)
    .map(schemaReference)
    .filter((item): item is SchemaReference => item !== null);
  const dateModified = cleanIsoDate(input.dateModified);

  if (
    !isValidId(input.id) ||
    !name ||
    !description ||
    !isAbsoluteHttpUrl(input.url) ||
    !isPartOf
  ) {
    return null;
  }

  return {
    "@type": "WebPage",
    "@id": input.id,
    name,
    description,
    url: input.url,
    isPartOf,
    ...(about.length ? { about } : {}),
    ...(dateModified ? { dateModified } : {}),
  };
}

export function buildArticle(input: {
  id: string;
  headline: string | null | undefined;
  description: string | null | undefined;
  url: string;
  webPageId: string;
  publisherId?: string;
  authorId?: string | null;
  imageId?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  articleSection?: string | null;
  keywords?: readonly string[] | null;
}): ArticleEntity | null {
  const headline = cleanText(input.headline);
  const description = cleanText(input.description);
  const mainEntityOfPage = schemaReference(input.webPageId);
  const publisher = schemaReference(input.publisherId ?? ORGANIZATION_ID);
  const author = input.authorId
    ? schemaReference(input.authorId)
    : null;
  const image = input.imageId ? schemaReference(input.imageId) : null;
  const datePublished = cleanIsoDate(input.datePublished);
  const dateModified = cleanIsoDate(input.dateModified);
  const articleSection = cleanText(input.articleSection);
  const keywords = cleanStringList(input.keywords);

  if (
    !isValidId(input.id) ||
    !headline ||
    !description ||
    !isAbsoluteHttpUrl(input.url) ||
    !mainEntityOfPage ||
    !publisher
  ) {
    return null;
  }

  return {
    "@type": "Article",
    "@id": input.id,
    headline,
    description,
    url: input.url,
    mainEntityOfPage,
    publisher,
    ...(author ? { author } : {}),
    ...(image ? { image } : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    ...(articleSection ? { articleSection } : {}),
    ...(keywords.length ? { keywords } : {}),
  };
}

export function buildBreadcrumbList(input: {
  id: string;
  items: readonly {
    name: string | null | undefined;
    url: string;
  }[];
}): BreadcrumbListEntity | null {
  if (!isValidId(input.id) || input.items.length === 0) return null;

  const items = input.items.map((item, index) => {
    const name = cleanText(item.name);
    if (!name || !isAbsoluteHttpUrl(item.url)) return null;

    return {
      "@type": "ListItem" as const,
      position: index + 1,
      name,
      item: item.url,
    };
  });

  if (items.some((item) => item === null)) return null;

  return {
    "@type": "BreadcrumbList",
    "@id": input.id,
    itemListElement: items as BreadcrumbListEntity["itemListElement"],
  };
}

export function buildFaqPage(input: {
  id: string;
  items: readonly {
    question: string | null | undefined;
    answer: string | null | undefined;
  }[];
}): FaqPageEntity | null {
  if (!isValidId(input.id)) return null;

  const questions = new Map<string, FaqPageEntity["mainEntity"][number]>();

  for (const item of input.items) {
    const question = cleanText(item.question);
    const answer = cleanText(item.answer);
    if (!question || !answer) continue;

    const key = question.toLocaleLowerCase("en-US").replace(/\s+/g, " ");
    if (questions.has(key)) continue;

    questions.set(key, {
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    });
  }

  if (questions.size === 0) return null;

  return {
    "@type": "FAQPage",
    "@id": input.id,
    mainEntity: Array.from(questions.values()),
  };
}

export function buildThing(input: {
  id: string;
  name: string | null | undefined;
  url: string;
  alternateName?: string | null;
  description?: string | null;
}): ThingEntity | null {
  const name = cleanText(input.name);
  const alternateName = cleanText(input.alternateName);
  const description = cleanText(input.description);

  if (!isValidId(input.id) || !name || !isAbsoluteHttpUrl(input.url)) {
    return null;
  }

  return {
    "@type": "Thing",
    "@id": input.id,
    name,
    url: input.url,
    ...(alternateName ? { alternateName } : {}),
    ...(description ? { description } : {}),
  };
}

export function buildItemList(input: {
  id: string;
  items: readonly {
    name: string | null | undefined;
    url: string;
  }[];
}): ItemListEntity | null {
  if (!isValidId(input.id) || input.items.length === 0) return null;

  const items = input.items.map((item, index) => {
    const name = cleanText(item.name);
    if (!name || !isAbsoluteHttpUrl(item.url)) return null;

    return {
      "@type": "ListItem" as const,
      position: index + 1,
      name,
      url: item.url,
    };
  });

  if (items.some((item) => item === null)) return null;

  return {
    "@type": "ItemList",
    "@id": input.id,
    numberOfItems: items.length,
    itemListElement: items as ItemListEntity["itemListElement"],
  };
}

export function buildCollectionPage(input: {
  id: string;
  name: string | null | undefined;
  description: string | null | undefined;
  url: string;
  websiteId?: string;
  itemListId?: string | null;
}): CollectionPageEntity | null {
  const name = cleanText(input.name);
  const description = cleanText(input.description);
  const isPartOf = schemaReference(input.websiteId ?? WEBSITE_ID);
  const mainEntity = input.itemListId
    ? schemaReference(input.itemListId)
    : null;

  if (
    !isValidId(input.id) ||
    !name ||
    !description ||
    !isAbsoluteHttpUrl(input.url) ||
    !isPartOf ||
    (input.itemListId && !mainEntity)
  ) {
    return null;
  }

  return {
    "@type": "CollectionPage",
    "@id": input.id,
    name,
    description,
    url: input.url,
    isPartOf,
    ...(mainEntity ? { mainEntity } : {}),
  };
}
