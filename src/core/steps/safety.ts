// Step 1 — safety blocks. All blocks are evaluated, in this order.
import { THRESHOLDS as T } from "../data/thresholds";
import type { BlockCode, CarbLoadingInput, RawWarning } from "../types";

export function safetyBlocks(input: CarbLoadingInput): RawWarning[] {
  const blocks: RawWarning[] = [];
  if (input.diabetes !== "no") blocks.push({ code: "BLOCK_DIABETES", trigger: { field: "diabetes", value: input.diabetes } });
  if (input.age < T.minAge.value) {
    blocks.push({ code: "BLOCK_MINOR", trigger: { field: "age", value: input.age }, params: { minAge: T.minAge.value } });
  }
  if (input.pregnant) blocks.push({ code: "BLOCK_PREGNANCY", trigger: { field: "pregnant", value: input.pregnant } });
  if (input.eatingDisorderHistory === "yes") {
    blocks.push({ code: "BLOCK_EATING_DISORDER", trigger: { field: "eatingDisorderHistory", value: input.eatingDisorderHistory } });
  }
  return blocks;
}

export const blockCodes = (blocks: RawWarning[]): BlockCode[] => blocks.map((b) => b.code as BlockCode);
