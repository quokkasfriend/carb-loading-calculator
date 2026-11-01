// Registry of warnings and blocks. The engine emits codes; severity, source and confidence come from here.
import type { BlockCode, Confidence, Severity, WarningCode, WarningMeta } from "../types";

const w = (
  severity: Severity,
  source: string,
  confidence: Confidence,
  note?: string,
): WarningMeta => (note === undefined ? { severity, source, confidence } : { severity, source, confidence, note });

/** Insertion order is the emission order of the warnings. */
export const WARNING_REGISTRY: Record<BlockCode | WarningCode, WarningMeta> = {
  BLOCK_DIABETES: w("block", "Riddell 2017; Riddell 2020", "low"),
  BLOCK_MINOR: w("block", "Jones 2026a", "low"),
  BLOCK_PREGNANCY: w("block", "general sports-nutrition research", "low"),
  BLOCK_EATING_DISORDER: w("block", "Mountjoy 2023", "low"),
  HIGH_DOSE_UNAVAILABLE: w("info", "general sports-nutrition research", "medium"),
  SESSION_TOO_CLOSE: w("warning", "Bussau 2002; Fairchild 2002", "heuristic"),
  DAYS_REDUCED_SESSION: w("info", "Jones 2026b", "medium"),
  DAYS_REDUCED_DATE: w("info", "product decision", "heuristic"),
  IBS: w("warning", "Lis 2018", "low"),
  SPORT_WEAK_EVIDENCE: w("info", "Jones 2026a; Solem 2025", "low"),
  BACK_TO_BACK_48H: w("warning", "McInerney 2005", "medium"),
  BACK_TO_BACK_UNCERTAIN: w("info", "Doering 2019; McInerney 2005", "medium"),
  ULTRA: w("info", "Jones 2026a", "low"),
  LCHF: w("warning", "Burke 2021", "low", "no consensus stated"),
  FILTER_GLUTEN: w("info", "general sports-nutrition research", "low", "no consensus stated"),
  FILTER_LACTOSE: w("info", "general sports-nutrition research", "low", "no consensus stated"),
  FILTER_GI: w("info", "Foo 2022", "low"),
  AGE_LIMITED_DATA: w("info", "Jones 2026a", "low"),
  REDS_SUPPORT: w("info", "product decision", "heuristic"),
  REDS_DOCTOR: w("warning", "Mountjoy 2023", "low", "no consensus stated"),
};

export const WARNING_ORDER = Object.keys(WARNING_REGISTRY) as (BlockCode | WarningCode)[];
