import { useTranslations } from "use-intl";
import type { GiHistory, UsualDiet } from "../../core";
import { OptionGroup } from "../fields";
import type { StepProps } from "./types";
import { YesNoGroup } from "./YesNoGroup";

const GI: GiHistory[] = ["none", "occasional", "frequent"];
const DIETS: UsualDiet[] = ["mixed", "lchf_keto"];

export function GutDietStep({ form, update, errors }: StepProps) {
  const t = useTranslations("CarbLoading.fields");
  return (
    <div className="flex flex-col gap-6">
      <OptionGroup<GiHistory>
        legend={t("giHistory.label")}
        hint={t("giHistory.help")}
        name="cl-gi"
        value={form.giHistory}
        onChange={(giHistory) => update({ giHistory })}
        options={GI.map((g) => ({ value: g, label: t(`giHistory.options.${g}`) }))}
        error={errors.giHistory}
      />
      <YesNoGroup field="ibsDiagnosed" value={form.ibsDiagnosed} onChange={(v) => update({ ibsDiagnosed: v })} error={errors.ibsDiagnosed} />
      <YesNoGroup field="coeliac" hint value={form.coeliac} onChange={(v) => update({ coeliac: v })} error={errors.coeliac} />
      <YesNoGroup
        field="lactoseIntolerance"
        hint
        value={form.lactoseIntolerance}
        onChange={(v) => update({ lactoseIntolerance: v })}
        error={errors.lactoseIntolerance}
      />
      <OptionGroup<UsualDiet>
        legend={t("usualDiet.label")}
        name="cl-diet"
        value={form.usualDiet}
        onChange={(usualDiet) => update({ usualDiet })}
        options={DIETS.map((d) => ({ value: d, label: t(`usualDiet.options.${d}`) }))}
        error={errors.usualDiet}
      />
    </div>
  );
}
