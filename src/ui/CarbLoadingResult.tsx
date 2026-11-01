import { useState, type ReactNode, type Ref } from "react";
import { useFormatter, useLocale, useTranslations } from "use-intl";
import { THRESHOLDS as T } from "../core";
import type { CarbLoadingPlan, FoodExample, LoadingDay, Warning } from "../core";
import { planToText } from "./planToText";
import {
  choText,
  confidenceText,
  dayCarbs,
  dayFibre,
  dayKcal,
  dayRecharge,
  dayTitle,
  dayTraining,
  fibreText,
  foodBadges,
  portionText,
  preRaceText,
  triggerText,
  warningText,
  warningsOf,
  type FormatDate,
  type Translate,
} from "./view";

const buttonClass =
  "cursor-pointer rounded-full border-2 border-black px-6 py-3 text-center font-display text-base text-black transition-transform hover:scale-105";

export function CarbLoadingResult({
  plan,
  onEdit,
  headingRef,
}: {
  plan: CarbLoadingPlan;
  onEdit: () => void;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  const tRaw = useTranslations("CarbLoading");
  const t = tRaw as unknown as Translate;
  const format = useFormatter();
  const locale = useLocale();
  // "YYYY-MM-DD" at noon UTC, so no time zone can move the day.
  const formatDate: FormatDate = (iso) =>
    format.dateTime(new Date(`${iso}T12:00:00Z`), { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const text = plan.loading === "blocked" ? "" : planToText(plan, t, formatDate, locale);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  const warnings = (list: Warning[]) =>
    list.length > 0 && (
      <ul className="flex flex-col gap-3">
        {list.map((w) => (
          <li key={w.code} className="flex flex-col gap-1 rounded-[20px] border-2 border-black p-4 text-black">
            <p>{warningText(w, t, formatDate)}</p>
            <p className="text-sm text-black/70">
              {triggerText(w, t)} · {confidenceText(w, t)}
            </p>
          </li>
        ))}
      </ul>
    );

  if (plan.loading === "blocked") {
    return (
      <section className="flex w-full max-w-3xl flex-col gap-6" aria-labelledby="cl-result-heading">
        <h2 id="cl-result-heading" ref={headingRef} tabIndex={-1} className="text-2xl font-bold tracking-tight text-black">
          {t("result.answer.blocked")}
        </h2>
        {warnings(plan.warnings)}
        <button type="button" onClick={onEdit} className={`${buttonClass} self-start`}>
          {t("result.edit")}
        </button>
      </section>
    );
  }

  const reason = t(`reasons.${plan.reason}`, { loadingAboveMin: T.loadingAboveMin.value, noTargetBelowMin: T.noTargetBelowMin.value });
  const days: LoadingDay[] = plan.loading === "yes" ? plan.days : [];
  const preRace = "preRace" in plan ? plan.preRace : undefined;
  const foods: FoodExample[] = "foods" in plan ? plan.foods : [];

  return (
    <section className="flex w-full max-w-3xl flex-col gap-6" aria-labelledby="cl-result-heading">
      <div className="flex flex-col gap-2">
        <h2 id="cl-result-heading" ref={headingRef} tabIndex={-1} className="text-2xl font-bold tracking-tight text-black">
          {t("result.heading")}
        </h2>
        <p className="text-xl font-bold text-black">{t(`result.answer.${plan.loading}`)}</p>
        <p className="text-black">{reason}</p>
      </div>

      {warnings(warningsOf(plan.warnings, "warning"))}

      {(days.length > 0 || (plan.loading === "no" && plan.eligibility === "fuel_up")) && (
        <p className="text-black">{t("result.blocksExplainer", { blockG: T.blockG.value })}</p>
      )}

      {days.length > 0 && (
        <ol className="flex flex-col gap-4">
          {days.map((d) => (
            <li key={d.offset} className="flex flex-col gap-1 rounded-[20px] border-2 border-black p-5 text-black">
              <h3 className="text-lg font-bold tracking-tight">{dayTitle(d, t, formatDate)}</h3>
              <p className="font-semibold">{dayCarbs(d.carbsG, d.blocks, t)}</p>
              <p>{dayKcal(d.kcal, t)}</p>
              <p>{dayFibre(d, t)}</p>
              <p>{dayTraining(d, t)}</p>
              <p>{dayRecharge(d, t)}</p>
            </li>
          ))}
        </ol>
      )}

      {plan.loading === "yes" && (
        <div className="flex flex-col gap-2 text-black">
          <p>{t("result.hardSessionLatest", { date: formatDate(plan.hardSessionLatest) })}</p>
          <p>
            {plan.carbType.kind === "mixed"
              ? t("result.carbType.mixed")
              : t("result.carbType.high_gi_half", { minHighGiBlocks: plan.carbType.minHighGiBlocks, blocks: plan.days[0].blocks })}
          </p>
          <p>{t("result.occasions", plan.occasionsPerDay)}</p>
        </div>
      )}

      {plan.loading === "no" && plan.eligibility === "fuel_up" && (
        <p className="rounded-[20px] border-2 border-black p-5 font-semibold text-black">
          {t("result.fuelUp", {
            date: formatDate(plan.fuelUpDay.date),
            carbsG: plan.fuelUpDay.carbsG,
            blocks: plan.fuelUpDay.blocks,
            blockG: T.blockG.value,
            gPerKg: plan.fuelUpDay.gPerKg,
          })}
        </p>
      )}

      {preRace && (
        <div className="flex flex-col gap-1 text-black">
          <p className="font-semibold">{preRaceText(preRace, t)}</p>
          <p>{t("result.preRace.composition")}</p>
          {preRace.usualMealsBefore && <p>{t("result.preRace.usualMealsBefore")}</p>}
          <p>{t("result.preRace.notCounted")}</p>
        </div>
      )}

      {plan.loading === "yes" && (
        <div className="flex flex-col gap-1 text-black">
          <p>{t(`expectation.${plan.expectation}`)}</p>
          <p>{t("result.weight", plan.weightGainPct)}</p>
        </div>
      )}

      {foods.length > 0 && <FoodsTable foods={foods} t={t} locale={locale} />}

      {warnings(warningsOf(plan.warnings, "info"))}

      <div aria-live="polite" className="text-sm font-semibold text-black print:hidden">
        {copyState === "copied" && t("result.copied")}
      </div>
      {copyState === "failed" && (
        <div className="flex flex-col gap-2 print:hidden">
          <p role="alert" className="text-sm font-semibold text-accent-foreground">
            {t("result.copyFailed")}
          </p>
          <textarea
            readOnly
            value={text}
            rows={10}
            onFocus={(e) => e.currentTarget.select()}
            aria-label={t("result.copy")}
            className="w-full rounded-[20px] border-2 border-black p-4 text-sm text-black"
          />
        </div>
      )}
      <div className="flex flex-col-reverse gap-3 tablet:flex-row tablet:justify-between print:hidden">
        <button type="button" onClick={onEdit} className={buttonClass}>
          {t("result.edit")}
        </button>
        <div className="flex flex-col gap-3 tablet:flex-row">
          <button type="button" onClick={() => window.print()} className={buttonClass}>
            {t("result.print")}
          </button>
          <button type="button" onClick={copy} className={buttonClass}>
            {t("result.copy")}
          </button>
        </div>
      </div>
    </section>
  );
}

function FoodsTable({ foods, t, locale }: { foods: FoodExample[]; t: Translate; locale: string }) {
  const groups = ["base", "low_residue", "other"] as const;
  const head = (label: ReactNode) => (
    <th scope="col" className="px-3 py-2 text-left text-sm font-bold">
      {label}
    </th>
  );
  return (
    <div className="flex flex-col gap-3 text-black">
      <h3 className="text-lg font-bold tracking-tight">{t("result.foods.heading", { blockG: T.blockG.value })}</h3>
      <div className="overflow-x-auto rounded-[20px] border-2 border-black">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              {head(t("result.foods.cols.food"))}
              {head(t("result.foods.cols.portion"))}
              {head(t("result.foods.cols.cho100"))}
              {head(t("result.foods.cols.fibre"))}
            </tr>
          </thead>
          {groups.map((group) => {
            const rows = foods.filter((f) => f.group === group);
            if (rows.length === 0) return null;
            return (
              <tbody key={group}>
                <tr>
                  <th scope="colgroup" colSpan={4} className="bg-black/5 px-3 py-2 text-left text-sm font-bold">
                    {t(`result.foods.groups.${group}`)}
                  </th>
                </tr>
                {rows.map((f) => (
                  <tr key={f.id} className="border-t border-black/20 align-top">
                    <th scope="row" className="px-3 py-2 text-left font-normal">
                      {t(`foods.${f.id}.name`)}
                      {f.hasNote && <span className="block text-sm text-black/70">{t(`foods.${f.id}.note`)}</span>}
                      {foodBadges(f, t).map((b) => (
                        <span key={b} className="mr-1 mt-1 inline-block rounded-full border border-black px-2 text-xs">
                          {b}
                        </span>
                      ))}
                    </th>
                    <td className="px-3 py-2">{portionText(f, locale)}</td>
                    <td className="px-3 py-2">{choText(f, t, locale)}</td>
                    <td className="px-3 py-2">{fibreText(f, t, locale)}</td>
                  </tr>
                ))}
              </tbody>
            );
          })}
        </table>
      </div>
      {foods.some((f) => f.labelSource) && <p className="text-sm text-black/70">{t("result.foods.labelSource")}</p>}
    </div>
  );
}
