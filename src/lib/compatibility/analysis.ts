import type {
  CompatibilityFinding,
  CompatibilityPairAnalysis,
  CompatibilityResult,
  SpeciesRow,
} from "./types";

export const COMPATIBILITY_ANALYSIS_VERSION = "2026.09.1";

function label(value: string | null | undefined, fallback = "not recorded") {
  return value?.trim() || fallback;
}

function number(value: number | null | undefined, suffix = "") {
  return value == null ? "not recorded" : `${value}${suffix}`;
}

function range(
  minimum: number | null | undefined,
  maximum: number | null | undefined,
  suffix = "",
) {
  return minimum == null || maximum == null
    ? "not fully recorded"
    : `${minimum}–${maximum}${suffix}`;
}

function overlap(
  firstMinimum: number | null,
  firstMaximum: number | null,
  secondMinimum: number | null,
  secondMaximum: number | null,
) {
  if (
    firstMinimum == null ||
    firstMaximum == null ||
    secondMinimum == null ||
    secondMaximum == null
  ) {
    return null;
  }

  const minimum = Math.max(firstMinimum, secondMinimum);
  const maximum = Math.min(firstMaximum, secondMaximum);
  return minimum <= maximum ? { minimum, maximum } : null;
}

function groupRequirement(species: SpeciesRow) {
  if ((species.min_group_size ?? 1) > 1) {
    return `${species.common_name} should be planned as a group of at least ${species.min_group_size}`;
  }
  return `${species.common_name} does not have a recorded minimum school larger than one`;
}

function latestDate(speciesA: SpeciesRow, speciesB: SpeciesRow) {
  const dates = [speciesA.updated_at, speciesB.updated_at]
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite);
  return dates.length ? new Date(Math.max(...dates)).toISOString() : null;
}

function findingSummary(findings: CompatibilityFinding[]) {
  const meaningful = findings.filter(
    (finding) =>
      finding.category !== "data-quality" &&
      !finding.message.startsWith("No structured"),
  );
  return meaningful.slice(0, 4).map((finding) => finding.message);
}

export function buildCompatibilityPairAnalysis(
  speciesA: SpeciesRow,
  speciesB: SpeciesRow,
  result: CompatibilityResult,
  findings: CompatibilityFinding[],
): CompatibilityPairAnalysis {
  const temperatureOverlap = overlap(
    speciesA.min_temp_f,
    speciesA.max_temp_f,
    speciesB.min_temp_f,
    speciesB.max_temp_f,
  );
  const phOverlap = overlap(
    speciesA.min_ph,
    speciesA.max_ph,
    speciesB.min_ph,
    speciesB.max_ph,
  );
  const largerTankSpecies =
    (speciesA.tank_size_gal ?? 0) >= (speciesB.tank_size_gal ?? 0)
      ? speciesA
      : speciesB;
  const largerSpecies =
    (speciesA.max_size_inches ?? 0) >= (speciesB.max_size_inches ?? 0)
      ? speciesA
      : speciesB;
  const sharedTemperature = temperatureOverlap
    ? `${temperatureOverlap.minimum}–${temperatureOverlap.maximum}°F`
    : "no complete overlap in the recorded ranges";
  const sharedPh = phOverlap
    ? `${phOverlap.minimum}–${phOverlap.maximum}`
    : "no complete overlap in the recorded ranges";
  const keyFindings = findingSummary(findings);

  return {
    version: COMPATIBILITY_ANALYSIS_VERSION,
    sourceDataUpdatedAt: latestDate(speciesA, speciesB),
    overview: `${speciesA.common_name} and ${speciesB.common_name} receive a ${result.verdict.replaceAll("-", " ")} verdict from the current structured assessment. ${speciesA.common_name} is recorded as ${label(speciesA.temperament).toLowerCase()} with an aggression level of ${number(speciesA.aggression_level, "/10")}; ${speciesB.common_name} is recorded as ${label(speciesB.temperament).toLowerCase()} with an aggression level of ${number(speciesB.aggression_level, "/10")}. The recommendation is based on the combined water, space, behavior, grouping, and predation checks below rather than on species names alone.`,
    water: `${speciesA.common_name} has a recorded temperature range of ${range(speciesA.min_temp_f, speciesA.max_temp_f, "°F")} and pH range of ${range(speciesA.min_ph, speciesA.max_ph)}. ${speciesB.common_name} is recorded at ${range(speciesB.min_temp_f, speciesB.max_temp_f, "°F")} and pH ${range(speciesB.min_ph, speciesB.max_ph)}. Their shared planning window is ${sharedTemperature} for temperature and ${sharedPh} for pH. A shared aquarium must stay inside the overlap rather than merely touching each species’ outer tolerance.`,
    space: `${largerTankSpecies.common_name} sets the larger listed base aquarium requirement at ${number(largerTankSpecies.tank_size_gal, " gallons")}; the other listed minimum is ${number(largerTankSpecies.id === speciesA.id ? speciesB.tank_size_gal : speciesA.tank_size_gal, " gallons")}. ${largerSpecies.common_name} is the larger adult by the recorded maximum, reaching ${number(largerSpecies.max_size_inches, " inches")}, compared with ${number(largerSpecies.id === speciesA.id ? speciesB.max_size_inches : speciesA.max_size_inches, " inches")}. These figures are starting constraints, not a stocking-capacity calculation, because the complete group sizes and bioload still matter.`,
    behavior: `${speciesA.common_name} is a ${label(speciesA.activity_level).toLowerCase()} species associated with the ${label(speciesA.territory_zone, "unspecified").toLowerCase()} zone and ${label(speciesA.flow_preference).toLowerCase()} flow. ${speciesB.common_name} is ${label(speciesB.activity_level).toLowerCase()}, uses the ${label(speciesB.territory_zone, "unspecified").toLowerCase()} zone, and has a ${label(speciesB.flow_preference).toLowerCase()} flow preference. ${groupRequirement(speciesA)}, while ${groupRequirement(speciesB).toLowerCase()}. The aquarium must support both social structures without forcing either species into insufficient space.`,
    husbandry: `${speciesA.common_name} is recorded as a ${label(speciesA.diet).toLowerCase()} with ${label(speciesA.care_level).toLowerCase()} care, while ${speciesB.common_name} is a ${label(speciesB.diet).toLowerCase()} with ${label(speciesB.care_level).toLowerCase()} care. Their listed preferred tank styles are ${label(speciesA.preferred_tank_style)} and ${label(speciesB.preferred_tank_style)}. Feeding access, cover, open swimming room, filtration, and observation should be planned around the more demanding requirement rather than averaged between the two species.`,
    keyFindings,
    checklist: [
      `Keep temperature within ${sharedTemperature}.`,
      `Keep pH within ${sharedPh}.`,
      `Use at least the larger ${number(largerTankSpecies.tank_size_gal, "-gallon")} base requirement before accounting for the complete stocking plan.`,
      `${groupRequirement(speciesA)}; ${groupRequirement(speciesB).toLowerCase()}.`,
      result.verdict === "not-recommended"
        ? "Choose separate aquariums or a different tank mate instead of attempting to manage a known blocking risk."
        : "Provide a separation plan and monitor feeding, stress, chasing, damaged fins, and access to preferred habitat zones.",
    ],
  };
}
