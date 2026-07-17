import type { AquariumValidator } from "../types";
import { compatibilityValidator } from "./compatibility";
import { heatingValidator } from "./heating";
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
  heatingValidator,
  compatibilityValidator,
  predationValidator,
  territorialValidator,
  stockingValidator,
];

export {
  compatibilityValidator,
  heatingValidator,
  predationValidator,
  schoolSizeValidator,
  stockingValidator,
  tankSizeValidator,
  territorialValidator,
  waterParameterValidator,
};
