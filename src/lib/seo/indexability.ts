import type { Metadata } from "next";

type SearchParamValue = string | string[] | undefined;
type SearchParams = Record<string, SearchParamValue>;

export const NOINDEX_FOLLOW: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: true,
  nocache: true,
};

export const NOINDEX_NOFOLLOW: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
  nocache: true,
};

export function hasActiveSearchParams(searchParams: SearchParams) {
  return Object.values(searchParams).some((value) =>
    Array.isArray(value)
      ? value.some((item) => item.trim().length > 0)
      : typeof value === "string" && value.trim().length > 0,
  );
}

export function getSearchVariantRobots(searchParams: SearchParams) {
  return hasActiveSearchParams(searchParams) ? NOINDEX_FOLLOW : undefined;
}
