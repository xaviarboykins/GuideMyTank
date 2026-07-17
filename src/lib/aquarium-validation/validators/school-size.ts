import type { AquariumResolvedLivestockEntry } from "@/lib/aquarium-builder/types";

import { AQUARIUM_VALIDATION_CODES } from "../constants";
import { createValidationIssue } from "../issues";
import type {
  AquariumValidationIssue,
  AquariumValidator,
} from "../types";

interface AggregatedLivestock {
  entry: AquariumResolvedLivestockEntry;
  quantity: number;
}

function aggregateLivestock(entries: AquariumResolvedLivestockEntry[]) {
  const aggregated = new Map<string, AggregatedLivestock>();

  for (const entry of entries) {
    const speciesId = entry.species.id;
    const existing = aggregated.get(speciesId);
    const quantity =
      Number.isInteger(entry.quantity) && entry.quantity > 0
        ? entry.quantity
        : 0;

    if (existing) {
      existing.quantity += quantity;
    } else {
      aggregated.set(speciesId, { entry, quantity });
    }
  }

  return Array.from(aggregated.values()).sort((entryA, entryB) =>
    entryA.entry.species.id.localeCompare(entryB.entry.species.id),
  );
}

export const schoolSizeValidator: AquariumValidator = {
  name: "school-size",

  async validate(context): Promise<AquariumValidationIssue[]> {
    const issues: AquariumValidationIssue[] = [];

    for (const livestock of aggregateLivestock(context.species)) {
      const item = livestock.entry.species;
      const recommendedMinimum = item.min_group_size;

      if (
        recommendedMinimum == null ||
        !Number.isInteger(recommendedMinimum) ||
        recommendedMinimum <= 0 ||
        livestock.quantity >= recommendedMinimum
      ) {
        continue;
      }

      const quantityNeeded = recommendedMinimum - livestock.quantity;

      issues.push(
        createValidationIssue({
          code: AQUARIUM_VALIDATION_CODES.schoolSizeBelowMinimum,
          category: "school_size",
          severity: "warning",
          title: `${item.common_name} group is too small`,
          message: `${item.common_name} has a documented minimum group size of ${recommendedMinimum}, but this build includes ${livestock.quantity}.`,
          recommendation: `Add ${quantityNeeded} more ${item.common_name}${quantityNeeded === 1 ? "" : "s"}, if tank capacity permits.`,
          affectedSpeciesIds: [item.id],
          metadata: {
            currentQuantity: livestock.quantity,
            recommendedMinimum,
            quantityNeeded,
          },
        }),
      );
    }

    return issues;
  },
};
