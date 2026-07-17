export { validateAquarium } from "./engine";
export {
  AQUARIUM_VALIDATION_CODES,
  VALIDATION_CATEGORIES,
  VALIDATION_SEVERITY_ORDER,
  type AquariumValidationCode,
} from "./constants";
export {
  createValidationIssue,
  deduplicateValidationIssues,
  getValidationIssueKey,
  sortValidationIssues,
  summarizeValidationIssues,
} from "./issues";
export {
  generateUniqueSpeciesPairs,
  getAquariumSpeciesPairKey,
} from "./pairs";
export type {
  AquariumCompatibilityResolver,
  AquariumSpeciesPair,
  AquariumValidationInput,
  AquariumValidationIssue,
  AquariumValidationOptions,
  AquariumValidationReport,
  AquariumValidationSummary,
  AquariumValidator,
  AquariumValidatorContext,
  ResolvedCompatibilityResult,
  ValidationCategory,
  ValidationSeverity,
} from "./types";
