import { useTranslations } from "use-intl";
import type { Sport } from "../../core";
import { THRESHOLDS as T } from "../../core";
import { DateField, DurationField, NumberField, OptionGroup, TimeField } from "../fields";
import type { StepProps } from "./types";

const SPORTS: Sport[] = ["cycling", "road_running", "trail", "swimming", "ocr", "triathlon", "other"];

export function RaceStep({ form, update, errors }: StepProps) {
  const t = useTranslations("CarbLoading.fields");
  return (
    <div className="flex flex-col gap-6">
      <OptionGroup<Sport>
        legend={t("sport.label")}
        name="cl-sport"
        value={form.sport}
        onChange={(sport) => update({ sport })}
        options={SPORTS.map((s) => ({ value: s, label: t(`sport.options.${s}`) }))}
        error={errors.sport}
      />
      <div className="grid gap-6 tablet:grid-cols-2">
        <DateField
          id="cl-race-date"
          label={t("raceDate.label")}
          value={form.raceDate}
          onChange={(raceDate) => update({ raceDate })}
          error={errors.raceDate}
        />
        <TimeField
          id="cl-start-time"
          label={t("startTime.label")}
          hint={t("startTime.help")}
          value={form.startTime}
          onChange={(startTime) => update({ startTime })}
          error={errors.startTime}
        />
      </div>
      <DurationField
        id="cl-duration"
        legend={t("duration.label")}
        hoursLabel={t("duration.hours")}
        minutesLabel={t("duration.minutes")}
        hint={t("duration.help", { loadingAboveMin: T.loadingAboveMin.value })}
        value={form.duration}
        onChange={(duration) => update({ duration })}
        error={errors.durationMin}
      />
      <NumberField
        id="cl-days-since"
        label={t("daysSinceLastRace.label")}
        hint={t("daysSinceLastRace.help", { max: T.daysSinceLastRace.value.max })}
        step="1"
        integer
        value={form.daysSinceLastRace}
        onChange={(daysSinceLastRace) => update({ daysSinceLastRace })}
        error={errors.daysSinceLastRace}
      />
    </div>
  );
}
