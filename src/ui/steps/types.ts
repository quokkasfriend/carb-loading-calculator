import type { FieldErrors, FormState } from "../formState";

export interface StepProps {
  form: FormState;
  update: (patch: Partial<FormState>) => void;
  errors: FieldErrors;
}
