import type { Json } from "../../types/database.types";

export type CareGuideSection = {
  id: string;
  section_type: string;
  heading: string | null;
  content: Json;
};

export type CareGuideChapter = {
  id: string;
  title: string;
  sections: CareGuideSection[];
};

const CHAPTERS = [
  {
    id: "understanding",
    title: "Understanding the species",
    sectionTypes: ["overview", "natural_habitat", "adult_size_and_lifespan"],
  },
  {
    id: "aquarium-setup",
    title: "Aquarium setup and water conditions",
    sectionTypes: [
      "aquarium_requirements",
      "water_parameters",
      "filtration_and_flow",
      "heating_requirements",
      "lighting",
      "substrate",
      "plants_and_decor",
    ],
  },
  {
    id: "behavior-community",
    title: "Behavior and community planning",
    sectionTypes: [
      "behavior_and_temperament",
      "social_requirements",
      "tank_mates",
      "species_to_avoid",
    ],
  },
  {
    id: "daily-care",
    title: "Feeding, health, and routine care",
    sectionTypes: ["diet_and_feeding", "common_health_concerns"],
  },
  {
    id: "long-term-care",
    title: "Breeding and long-term guidance",
    sectionTypes: ["breeding", "beginner_guidance"],
  },
] as const;

const standardSectionTypes = new Set<string>(
  CHAPTERS.flatMap((chapter) => [...chapter.sectionTypes]),
);

export function isStandardCareGuideSection(sectionType: string) {
  return standardSectionTypes.has(sectionType);
}

export function buildCareGuideChapters(
  sections: CareGuideSection[],
): CareGuideChapter[] {
  const byType = new Map(sections.map((section) => [section.section_type, section]));
  const chapters: CareGuideChapter[] = CHAPTERS.flatMap((chapter) => {
    const chapterSections = chapter.sectionTypes.flatMap((sectionType) => {
      const section = byType.get(sectionType);
      return section ? [section] : [];
    });
    return chapterSections.length
      ? [{ id: chapter.id, title: chapter.title, sections: chapterSections }]
      : [];
  });
  const customSections = sections.filter(
    (section) =>
      section.section_type !== "frequently_asked_questions" &&
      !isStandardCareGuideSection(section.section_type),
  );

  if (customSections.length) {
    chapters.push({
      id: "species-specific-guidance",
      title: "Species-specific guidance",
      sections: customSections,
    });
  }

  return chapters;
}
