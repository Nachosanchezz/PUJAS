"use client";

import { startTransition, useActionState, useRef, type FormEvent, type ReactNode } from "react";

export type FormState = { error: string | null };

type ActionFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  children: ReactNode;
};

const initialState: FormState = { error: null };

// Formulario reutilizable para cualquier Server Action que devuelva un FormState:
// muestra el error, desactiva el botón mientras envía y se vacía al terminar bien.
export function ActionForm({ action, submitLabel, children }: ActionFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState(
    async (previous: FormState, formData: FormData): Promise<FormState> => {
      const result = await action(previous, formData);
      // Si la acción redirige, no hay resultado que procesar
      if (!result) return previous;
      if (!result.error) formRef.current?.reset();
      return result;
    },
    initialState,
  );

  // Enviamos a mano en vez de usar <form action={...}> porque React vacía el
  // formulario tras cada envío, y si hay un error queremos conservar lo escrito.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
      {children}
      {state.error && (
        <p role="alert" className="text-sm text-alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-4 py-2 font-semibold text-black transition-colors hover:bg-brand-light disabled:opacity-50"
      >
        {pending ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}
