"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AuthActionState } from "@/server/auth/actions";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  disabled: boolean;
};

const initialState: AuthActionState = {
  ok: false,
  message: "",
};

export function AuthForm({ mode, action, disabled }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [timezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");

  return (
    <form action={formAction} className="grid gap-4">
      {mode === "sign-up" ? (
        <>
          <label className="grid gap-2 text-sm font-medium">
            Creator name
            <Input disabled={disabled || pending} name="displayName" placeholder="Ada from Social" required />
          </label>
          <input name="timezone" type="hidden" value={timezone} />
        </>
      ) : null}

      <label className="grid gap-2 text-sm font-medium">
        Email
        <Input disabled={disabled || pending} name="email" placeholder="creator@example.com" required type="email" />
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Password
        <Input
          disabled={disabled || pending}
          minLength={8}
          name="password"
          placeholder="At least 8 characters"
          required
          type="password"
        />
      </label>

      {state.message ? (
        <p className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}>{state.message}</p>
      ) : null}

      <Button disabled={disabled || pending} className="rounded-md" type="submit">
        {pending ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}
      </Button>
    </form>
  );
}
