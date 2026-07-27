import { afterEach, describe, expect, it, vi } from "vitest";

import { buildPageMetadata, getBrandedTitle } from "./metadata";

afterEach(() => vi.unstubAllEnvs());

describe("shared page metadata", () => {
  it("adds the brand exactly once", () => {
    expect(getBrandedTitle("Neon Tetra Care Guide")).toBe(
      "Neon Tetra Care Guide | GuideMyTank",
    );
    expect(getBrandedTitle("Neon Tetra Care Guide | GuideMyTank")).toBe(
      "Neon Tetra Care Guide | GuideMyTank",
    );
  });

  it("builds matching canonical, Open Graph, and Twitter metadata", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SITE_URL", "");
    const metadata = buildPageMetadata({
      title: "Neon Tetra Species Profile and Care Data",
      description: "Freshwater aquarium species data.",
      path: "/species/neon-tetra",
    });

    expect(metadata.alternates?.canonical).toBe(
      "https://www.guidemytank.com/species/neon-tetra",
    );
    expect(metadata.openGraph).toMatchObject({
      title: "Neon Tetra Species Profile and Care Data | GuideMyTank",
      url: "https://www.guidemytank.com/species/neon-tetra",
    });
    expect(metadata.twitter).toMatchObject({ card: "summary" });
  });

  it("adds a stable image consistently to social metadata", () => {
    const metadata = buildPageMetadata({
      title: "Betta Species Profile",
      description: "Freshwater aquarium species data.",
      path: "/species/betta",
      image: {
        url: "/species/betta-splendens.webp",
        alt: "Betta splendens",
        width: 1200,
        height: 900,
      },
    });

    expect(metadata.openGraph).toMatchObject({
      images: [
        {
          url: "https://www.guidemytank.com/species/betta-splendens.webp",
          alt: "Betta splendens",
          width: 1200,
          height: 900,
        },
      ],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: [
        {
          url: "https://www.guidemytank.com/species/betta-splendens.webp",
        },
      ],
    });
  });
});
