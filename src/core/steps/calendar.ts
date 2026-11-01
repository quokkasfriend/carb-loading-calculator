// Step 4 — calendar and reduction of the loading days. Only for the loading branch.
import { THRESHOLDS as T } from "../data/thresholds";
import { addDays, gap } from "../dates";
import type { CarbLoadingInput, LoadingDay, LoadingDaysOption, RawWarning } from "../types";

interface CalendarDay {
  offset: LoadingDay["offset"];
  date: string;
  trainingMaxMin: number;
}

export interface Calendar {
  requestedDays: LoadingDaysOption;
  effectiveDays: number;
  days: CalendarDay[];
  hardSessionLatest: string;
  carbType: "mixed" | "high_gi_half";
  fibre: "usual" | "under_10g";
  warnings: RawWarning[];
}

export function buildCalendar(
  input: Pick<CarbLoadingInput, "raceDate" | "today" | "loadingDays" | "lastHardSession" | "giHistory">,
): Calendar {
  const { raceDate, today, lastHardSession, giHistory } = input;
  if (input.loadingDays === undefined || lastHardSession === undefined) throw new Error("loading input is incomplete");
  const requestedDays = input.loadingDays;

  const session = lastHardSession.kind === "date" ? lastHardSession.date : undefined;
  const sessionGap = session === undefined ? undefined : gap(session, raceDate);
  const maxBySession = sessionGap === undefined ? Infinity : Math.max(sessionGap - 1, T.loadingDays.value.min);
  const sessionTooClose = sessionGap === 1;
  const maxByToday = gap(today, raceDate);
  const effectiveDays = Math.min(requestedDays, maxBySession, maxByToday);

  const warnings: RawWarning[] = [];
  if (sessionTooClose) {
    warnings.push({ code: "SESSION_TOO_CLOSE", trigger: { field: "lastHardSession", value: lastHardSession } });
  } else if (maxBySession < requestedDays && maxBySession <= maxByToday) {
    warnings.push({
      code: "DAYS_REDUCED_SESSION",
      trigger: { field: "lastHardSession", value: lastHardSession },
      params: { requested: requestedDays, effective: effectiveDays, sessionDate: session as string },
    });
  } else if (maxByToday < requestedDays) {
    warnings.push({
      code: "DAYS_REDUCED_DATE",
      trigger: { field: "raceDate", value: raceDate },
      params: { requested: requestedDays, effective: effectiveDays },
    });
  }

  const days: CalendarDay[] = [];
  for (let n = effectiveDays; n >= 1; n--) {
    days.push({
      offset: n as LoadingDay["offset"],
      date: addDays(raceDate, -n),
      trainingMaxMin: n === 1 ? T.trainingMaxMin.value.lastDay : T.trainingMaxMin.value.otherDays,
    });
  }

  return {
    requestedDays,
    effectiveDays,
    days,
    hardSessionLatest: addDays(raceDate, -(effectiveDays + 1)),
    carbType: effectiveDays === 1 ? "high_gi_half" : "mixed",
    fibre: giHistory === "frequent" ? "under_10g" : "usual",
    warnings,
  };
}
