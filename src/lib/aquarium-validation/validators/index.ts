import type { AquariumValidator } from "../types";
import { compatibilityValidator } from "./compatibility";
import { predationValidator } from "./predation";
import { schoolSizeValidator } from "./school-size";
import { stockingValidator } from "./stocking";
import { tankSizeValidator } from "./tank-size";
import { territorialValidator } from "./territorial";
import { waterParameterValidator } from "./water-parameters";

export const aquariumValidators: readonly AquariumValidator[] = [
  tankSizeValidator,
  schoolSizeValidator,
  waterParameterValidator,
  compatibilityValidator,
  predationValidator,
  territorialValidator,
  stockingValidator,
];

export {
  compatibilityValidator,
  predationValidator,
  schoolSizeValidator,
  stockingValidator,
  tankSizeValidator,
  territorialValidator,
  waterParameterValidator,
};
