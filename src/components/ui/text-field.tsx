import type { InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
};

// Etiqueta + campo. El <input> va dentro del <label>, así quedan asociados sin
// necesidad de id. text-base (16 px) evita que el iPhone haga zoom al escribir.
export function TextField({ label, className, ...inputProps }: TextFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-foreground/70">{label}</span>
      <input
        {...inputProps}
        className={`rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-base outline-none transition-colors focus:border-emerald-500 ${className ?? ""}`}
      />
    </label>
  );
}
