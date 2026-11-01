import { useTranslations } from "use-intl";
import type { Sex } from "../../core";
import { NumberField, OptionGroup } from "../fields";
import type { StepProps } from "./types";

const SEXES: Sex[] = ["female", "male", "other"];

export function AthleteStep({ form, update, errors }: StepProps) {
  const t = useTranslations("CarbLoading.fields");
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 tablet:grid-cols-2">
        <NumberField
          id="cl-weight"
          label={t("weightKg.label")}
          hint={t("weightKg.help")}
          value={form.weightKg}
          onChange={(weightKg) => update({ weightKg })}
          error={errors.weightKg}
        />
        <NumberField
          id="cl-age"
          label={t("age.label")}
          step="1"
          integer
          value={form.age}
          onChange={(age) => update({ age })}
          error={errors.age}
        />
      </div>
      <OptionGroup<Sex>
        legend={t("sex.label")}
        hint={t("sex.help")}
        name="cl-sex"
        value={form.sex}
        onChange={(sex) => update({ sex })}
        options={SEXES.map((s) => ({ value: s, label: t(`sex.options.${s}`) }))}
        error={errors.sex}
      />
    </div>
  );
}
