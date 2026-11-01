import { useTranslations } from "use-intl";
import type { BigMealTolerance, DoseLevel, RaceCarbs } from "../../core";
import { THRESHOLDS as T, isHighDoseAllowed } from "../../core";
import { CheckboxField, DateField, OptionGroup } from "../fields";
import { hmToMinutes } from "../formState";
import type { StepProps } from "./types";

const DOSES: DoseLevel[] = ["minimum", "standard", "high"];
const RACE_CARBS: RaceCarbs[] = ["zero", "1_29", "30_59", "60_89", "90_plus", "dont_know"];
const TOLERANCES: BigMealTolerance[] = ["low", "normal", "high"];

export function PrepStep({ form, update, errors }: StepProps) {
  const t = useTranslations("CarbLoading.fields");
  const duration = hmToMinutes(form.duration) ?? 0;
  const loads = duration > T.loadingAboveMin.value;
  const highAllowed = form.giHistory === "" || isHighDoseAllowed(form.giHistory);
  const doses = T.doseGPerKg.value;

  return (
    <div className="flex flex-col gap-6">
      {loads && (
        <>
          <OptionGroup<string>
            legend={t("loadingDays.label")}
            hint={t("loadingDays.help", { default: T.loadingDays.value.default })}
            name="cl-loading-days"
            value={form.loadingDays}
            onChange={(loadingDays) => update({ loadingDays })}
            options={T.loadingDays.value.options.map((n) => ({ value: String(n), label: t(`loadingDays.options.${n}`) }))}
            error={errors.loadingDays}
          />
          <OptionGroup<DoseLevel>
            legend={t("doseLevel.label")}
            hint={t("doseLevel.help")}
            name="cl-dose"
            value={form.doseLevel}
            onChange={(doseLevel) => update({ doseLevel })}
            options={DOSES.map((d) => ({
              value: d,
              label: t(`doseLevel.options.${d}`, doses),
              disabled: d === "high" && !highAllowed,
            }))}
            disabledNote={t("doseLevel.highDisabled")}
            error={errors.doseLevel}
          />
          <div className="flex flex-col gap-3">
            <DateField
              id="cl-hard-session"
              label={t("lastHardSession.label")}
              hint={t("lastHardSession.help")}
              value={form.lastHardSessionDate}
              disabled={form.noRecentHardSession}
              onChange={(lastHardSessionDate) => update({ lastHardSessionDate })}
              error={errors.lastHardSession}
            />
            <CheckboxField
              label={t("lastHardSession.noneRecent", { max: T.hardSessionLookbackDays.value })}
              checked={form.noRecentHardSession}
              onChange={(noRecentHardSession) => update({ noRecentHardSession, lastHardSessionDate: "" })}
            />
          </div>
          <OptionGroup<RaceCarbs>
            legend={t("raceCarbs.label")}
            name="cl-race-carbs"
            value={form.raceCarbs}
            onChange={(raceCarbs) => update({ raceCarbs })}
            options={RACE_CARBS.map((r) => ({ value: r, label: t(`raceCarbs.options.${r}`) }))}
            error={errors.raceCarbs}
          />
        </>
      )}
      <OptionGroup<string>
        legend={t("preMealHours.label")}
        name="cl-pre-meal"
        value={form.preMealHours}
        onChange={(preMealHours) => update({ preMealHours })}
        options={T.preMealDose.value.hoursOptions.map((h) => ({ value: String(h), label: t(`preMealHours.options.${h}`) }))}
        error={errors.preMealHours}
      />
      <OptionGroup<BigMealTolerance>
        legend={t("bigMealTolerance.label")}
        hint={t("bigMealTolerance.help", { minHours: T.preMealHighTolerance.value.minHours })}
        name="cl-big-meal"
        value={form.bigMealTolerance}
        onChange={(bigMealTolerance) => update({ bigMealTolerance })}
        options={TOLERANCES.map((x) => ({ value: x, label: t(`bigMealTolerance.options.${x}`) }))}
        error={errors.bigMealTolerance}
      />
    </div>
  );
}
