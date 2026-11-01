import { useId, type ReactNode } from "react";
import { useTranslations } from "use-intl";

/** An error of one field, as reported by the engine's validation. */
export interface FieldError {
  type: "required" | "range" | "invalid" | "raceTooSoon" | "raceTooFar" | "sessionAfterRace" | "sessionTooOld";
  min?: number;
  max?: number;
}

const inputClass =
  "w-full rounded-full border-2 border-black bg-white px-5 py-3 text-base text-black placeholder:text-black/50 aria-[invalid=true]:border-accent-foreground";

function ErrorText({ id, error }: { id: string; error?: FieldError }) {
  const t = useTranslations("CarbLoading.errors");
  if (!error) return null;
  return (
    <p id={id} role="alert" className="text-sm font-semibold text-accent-foreground">
      {t(error.type, { min: error.min ?? 0, max: error.max ?? 0 })}
    </p>
  );
}

function Hint({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="text-sm text-black/70">
      {children}
    </p>
  );
}

/** Joins the ids that apply (`hint && id` style arguments: anything that is not a string is dropped). */
const describedBy = (...ids: unknown[]) => ids.filter((id): id is string => typeof id === "string" && id !== "").join(" ") || undefined;

export function NumberField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  step = "any",
  min,
  max,
  integer,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: FieldError;
  hint?: ReactNode;
  step?: string;
  min?: number;
  max?: number;
  integer?: boolean;
}) {
  const errId = `${id}-error`;
  const hintId = `${id}-hint`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-semibold text-black">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode={integer ? "numeric" : "decimal"}
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint && hintId, error && errId)}
        className={inputClass}
      />
      {hint && <Hint id={hintId}>{hint}</Hint>}
      <ErrorText id={errId} error={error} />
    </div>
  );
}

/** A text-like input: date or time. */
function TypedField({
  id,
  label,
  type,
  value,
  onChange,
  error,
  hint,
  disabled,
}: {
  id: string;
  label: string;
  type: "date" | "time";
  value: string;
  onChange: (v: string) => void;
  error?: FieldError;
  hint?: ReactNode;
  disabled?: boolean;
}) {
  const errId = `${id}-error`;
  const hintId = `${id}-hint`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-semibold text-black">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint && hintId, error && errId)}
        className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
      />
      {hint && <Hint id={hintId}>{hint}</Hint>}
      <ErrorText id={errId} error={error} />
    </div>
  );
}

export const DateField = (props: Omit<Parameters<typeof TypedField>[0], "type">) => <TypedField {...props} type="date" />;
export const TimeField = (props: Omit<Parameters<typeof TypedField>[0], "type">) => <TypedField {...props} type="time" />;

/** Hours + minutes inputs for a duration. */
export function DurationField({
  id,
  legend,
  hoursLabel,
  minutesLabel,
  value,
  onChange,
  error,
  hint,
}: {
  id: string;
  legend: string;
  hoursLabel: string;
  minutesLabel: string;
  value: { h: string; m: string };
  onChange: (v: { h: string; m: string }) => void;
  error?: FieldError;
  hint?: ReactNode;
}) {
  const errId = `${id}-error`;
  const hintId = `${id}-hint`;
  const described = describedBy(hint && hintId, error && errId);
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 font-semibold text-black">{legend}</legend>
      <div className="flex gap-3">
        <input
          id={`${id}-h`}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          aria-label={hoursLabel}
          placeholder={hoursLabel}
          value={value.h}
          onChange={(e) => onChange({ ...value, h: e.target.value })}
          aria-invalid={error ? true : undefined}
          aria-describedby={described}
          className={inputClass}
        />
        <input
          id={`${id}-m`}
          type="number"
          inputMode="numeric"
          min={0}
          max={59}
          step={1}
          aria-label={minutesLabel}
          placeholder={minutesLabel}
          value={value.m}
          onChange={(e) => onChange({ ...value, m: e.target.value })}
          aria-invalid={error ? true : undefined}
          aria-describedby={described}
          className={inputClass}
        />
      </div>
      {hint && <Hint id={hintId}>{hint}</Hint>}
      <ErrorText id={errId} error={error} />
    </fieldset>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
  hint,
  disabled,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-black">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby={hint ? hintId : undefined}
          className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-primary"
        />
        <span>{label}</span>
      </label>
      {hint && (
        <p id={hintId} className="pl-8 text-sm text-black/70">
          {hint}
        </p>
      )}
    </div>
  );
}

export interface Option<T extends string> {
  value: T;
  label: string;
  help?: string;
  /** Shown but not selectable (aria-disabled). */
  disabled?: boolean;
}

/** Pill-style radio group. An option can be disabled; `disabledNote` explains why. */
export function OptionGroup<T extends string>({
  legend,
  name,
  value,
  onChange,
  options,
  error,
  errorId,
  hint,
  disabledNote,
}: {
  legend: string;
  name: string;
  value: "" | T;
  onChange: (v: T) => void;
  options: Option<T>[];
  error?: FieldError;
  errorId?: string;
  hint?: ReactNode;
  disabledNote?: string;
}) {
  const id = useId();
  const errId = errorId ?? `${id}-error`;
  const hintId = `${id}-hint`;
  const noteId = `${id}-note`;
  const selectedHelp = options.find((o) => o.value === value)?.help;
  const showNote = disabledNote !== undefined && options.some((o) => o.disabled);
  return (
    <fieldset
      className="flex flex-col gap-2"
      aria-describedby={describedBy(hint && hintId, showNote && noteId, error && errId)}
    >
      <legend className="mb-1 font-semibold text-black">{legend}</legend>
      {hint && <Hint id={hintId}>{hint}</Hint>}
      <div className="flex flex-wrap gap-2">
        {options.map((o, i) => (
          <label key={o.value} className={o.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}>
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              aria-disabled={o.disabled ? true : undefined}
              aria-invalid={error && i === 0 ? true : undefined}
              onChange={() => {
                if (!o.disabled) onChange(o.value);
              }}
              className="peer sr-only"
            />
            <span className="inline-flex min-h-11 items-center rounded-full border-2 border-black bg-white px-4 py-2 text-black transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-black">
              {o.label}
            </span>
          </label>
        ))}
      </div>
      {showNote && <Hint id={noteId}>{disabledNote}</Hint>}
      {selectedHelp && <p className="text-sm text-black/70">{selectedHelp}</p>}
      <ErrorText id={errId} error={error} />
    </fieldset>
  );
}
