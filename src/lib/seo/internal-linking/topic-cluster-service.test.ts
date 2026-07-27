import { describe, expect, it } from "vitest";

import {
  getMatchingTopicClusters,
  resolveTopicClusterHub,
  resolveTopicClusterMembers,
} from "./topic-cluster-service";
import { topicClusters } from "./topic-clusters";

const bettaCluster = topicClusters[0];
const popularFishCluster = topicClusters[1];

describe("topic cluster matching and resolution", () => {
  it("matches configured species, Care Guides, and reports", () => {
    expect(
      getMatchingTopicClusters({
        entityType: "species",
        slug: "betta-splendens",
      }),
    ).toContain(bettaCluster);
    expect(
      getMatchingTopicClusters({
        entityType: "care-guide",
        slug: "betta-splendens",
      }),
    ).toContain(bettaCluster);
    expect(
      getMatchingTopicClusters({
        entityType: "article",
        slug: "most-popular-freshwater-aquarium-fish-2026",
      }),
    ).toContain(popularFishCluster);
    expect(
      getMatchingTopicClusters({
        entityType: "guide",
        slug: "betta-splendens-vs-guppy",
      }),
    ).toContain(bettaCluster);
    expect(
      getMatchingTopicClusters({
        entityType: "compatibility-report",
        speciesSlugs: ["betta-splendens", "neon-tetra"],
      }),
    ).toContain(bettaCluster);
  });

  it("does not match unrelated content", () => {
    expect(
      getMatchingTopicClusters({
        entityType: "species",
        slug: "oscar",
      }),
    ).toEqual([]);
  });

  it("resolves the existing cluster hub", () => {
    expect(resolveTopicClusterHub(bettaCluster)).toMatchObject({
      entityType: "topic-cluster",
      entityId: "betta-compatibility",
      href: "/species/betta-splendens",
    });
  });

  it("excludes unavailable members and the current page", () => {
    const links = resolveTopicClusterMembers(
      bettaCluster,
      {
        speciesSlugs: new Set(["betta-splendens"]),
        careGuideSlugs: new Set(["betta-splendens"]),
        articleSlugs: new Set(),
        guideSlugs: new Set(["betta-splendens-vs-guppy"]),
        productCategories: new Set(["heaters"]),
      },
      {
        entityType: "species",
        entityId: "betta-splendens",
        href: "/species/betta-splendens",
      },
    );

    expect(links.map((link) => link.href)).toEqual([
      "/care-guides/betta-splendens",
      "/learning-center/guides/betta-splendens-vs-guppy",
      "/aquarium-builder/products/heaters",
    ]);
  });
});
