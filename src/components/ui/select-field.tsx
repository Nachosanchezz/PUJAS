import type { SelectHTMLAttributes } from "react";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  placeholder?: string;
};

// Etiqueta + desplegable, con el mismo estilo que TextField
export function SelectField({ label, options, placeholder, className, ...selectProps }: SelectFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-foreground/70">{label}</span>
      <select
        defaultValue=""
        {...selectProps}
        className={`rounded-lg border border-foreground/15 bg-background px-3 py-2 text-base outline-none transition-colors focus:border-brand ${className ?? ""}`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
