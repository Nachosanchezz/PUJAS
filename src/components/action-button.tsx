"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { FormState } from "@/components/action-form";

const VARIANTS = {
  primary: "bg-brand text-black hover:bg-brand-light",
  secondary: "border border-foreground/20 hover:bg-foreground/10",
  danger: "border border-alert/40 text-alert hover:bg-alert/10",
} as const;

type ActionButtonProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  // Datos que se envían con el botón (campos ocultos)
  fields: Record<string, string>;
  label: string;
  variant?: keyof typeof VARIANTS;
  // Si se indica, pide confirmación antes de ejecutar la acción
  confirmMessage?: string;
};

const initialState: FormState = { error: null };

// Un botón que ejecuta una Server Action y muestra su error debajo
export function ActionButton({
  action,
  fields,
  label,
  variant = "primary",
  confirmMessage,
}: ActionButtonProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-1">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        disabled={pending}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${VARIANTS[variant]}`}
      >
        {pending ? "…" : label}
      </button>
      {state.error && (
        <p role="alert" className="text-sm text-alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
