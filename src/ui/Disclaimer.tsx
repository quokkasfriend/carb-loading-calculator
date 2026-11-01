import { useTranslations } from "use-intl";

export function Disclaimer() {
  const t = useTranslations("CarbLoading.disclaimer");
  return (
    <aside
      aria-labelledby="cl-disclaimer-heading"
      className="flex w-full max-w-3xl flex-col gap-3 rounded-[20px] border-2 border-black p-5 text-sm text-black print:hidden"
    >
      <h2 id="cl-disclaimer-heading" className="text-base font-bold tracking-tight">
        {t("heading")}
      </h2>
      <p>{t("p1")}</p>
      <p>{t("p2")}</p>
      <p>{t("p3")}</p>
    </aside>
  );
}
