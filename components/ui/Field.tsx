import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-card border border-petal/60 bg-deep/40 px-4 py-3 text-base text-paper placeholder:text-muted/70 hover:border-petal focus:border-glow aria-[invalid=true]:border-danger";

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
};

/** Подпись, поле и ошибка. Поле внутри получает id, aria-invalid и aria-describedby от вызывающего. */
export function Field({ id, label, hint, error, optional, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-medium text-paper">
        {label}
        {optional && <span className="ml-2 font-normal text-muted">необязательно</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-2 text-sm text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
