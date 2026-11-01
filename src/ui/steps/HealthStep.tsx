import { useTranslations } from "use-intl";
import type { Diabetes, EatingDisorderHistory } from "../../core";
import { OptionGroup } from "../fields";
import type { StepProps } from "./types";
import { YesNoGroup } from "./YesNoGroup";

const DIABETES: Diabetes[] = ["no", "type_1", "type_2", "other"];
const EATING: EatingDisorderHistory[] = ["no", "yes", "prefer_not_to_say"];

export function HealthStep({ form, update, errors }: StepProps) {
  const t = useTranslations("CarbLoading");
  const askWomenQuestions = form.sex !== "male";
  return (
    <div className="flex flex-col gap-6">
      <p className="text-black">{t("health.intro")}</p>
      <OptionGroup<Diabetes>
        legend={t("fields.diabetes.label")}
        name="cl-diabetes"
        value={form.diabetes}
        onChange={(diabetes) => update({ diabetes })}
        options={DIABETES.map((d) => ({ value: d, label: t(`fields.diabetes.options.${d}`) }))}
        error={errors.diabetes}
      />
      {askWomenQuestions && (
        <YesNoGroup field="pregnant" value={form.pregnant} onChange={(v) => update({ pregnant: v })} error={errors.pregnant} />
      )}
      <OptionGroup<EatingDisorderHistory>
        legend={t("fields.eatingDisorderHistory.label")}
        name="cl-eating"
        value={form.eatingDisorderHistory}
        onChange={(eatingDisorderHistory) => update({ eatingDisorderHistory })}
        options={EATING.map((d) => ({ value: d, label: t(`fields.eatingDisorderHistory.options.${d}`) }))}
        error={errors.eatingDisorderHistory}
      />
      <YesNoGroup
        field="redsOrLowEnergyDiagnosis"
        hint
        value={form.redsOrLowEnergyDiagnosis}
        onChange={(v) => update({ redsOrLowEnergyDiagnosis: v })}
        error={errors.redsOrLowEnergyDiagnosis}
      />
      {askWomenQuestions && (
        <YesNoGroup
          field="amenorrhea3Months"
          value={form.amenorrhea3Months}
          onChange={(v) => update({ amenorrhea3Months: v })}
          error={errors.amenorrhea3Months}
        />
      )}
    </div>
  );
}
