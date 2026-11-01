import { useTranslations } from "use-intl";
import { OptionGroup, type FieldError } from "../fields";
import type { YesNo } from "../formState";

/** Yes/No question without a preselected answer. `field` is the key under `CarbLoading.fields`. */
export function YesNoGroup({
  field,
  value,
  onChange,
  error,
  hint,
}: {
  field: string;
  value: YesNo;
  onChange: (v: "yes" | "no") => void;
  error?: FieldError;
  hint?: boolean;
}) {
  const t = useTranslations("CarbLoading.fields");
  return (
    <OptionGroup<"yes" | "no">
      legend={t(`${field}.label`)}
      name={`cl-${field}`}
      value={value}
      onChange={onChange}
      hint={hint ? t(`${field}.help`) : undefined}
      options={[
        { value: "yes", label: t(`${field}.options.yes`) },
        { value: "no", label: t(`${field}.options.no`) },
      ]}
      error={error}
    />
  );
}
