// Step 7 — what to expect from the loading. It does not change the dose.
import { THRESHOLDS as T } from "../data/thresholds";
import type { ExpectationCode, RaceCarbs } from "../types";

export const expectationOf = (raceCarbs: RaceCarbs): ExpectationCode => T.raceCarbsExpectation.value[raceCarbs];
