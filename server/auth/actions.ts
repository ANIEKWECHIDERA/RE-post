"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getServerEnv } from "@/lib/env/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema } from "@/schemas/auth";

export type AuthActionState = {
  ok: boolean;
  message: string;
};

const defaultError = "We could not complete that auth request. Try again in a moment.";

export async function signInAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured yet. Add the public project URL and anon key first.",
    };
  }

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? defaultError,
    };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      ok: false,
      message: "Those sign-in details did not work.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUpAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured yet. Add the public project URL and anon key first.",
    };
  }

  const parsed = signUpSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    timezone: formData.get("timezone") || "UTC",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? defaultError,
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: await getAuthCallbackUrl(),
      data: {
        display_name: parsed.data.displayName,
        timezone: parsed.data.timezone,
      },
    },
  });

  if (error) {
    return {
      ok: false,
      message: "We could not create that account.",
    };
  }

  if (!data.session) {
    return {
      ok: true,
      message: "Account created. Check your email if confirmation is enabled.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

async function getAuthCallbackUrl() {
  const env = getServerEnv();
  const configuredOrigin = env?.NEXT_PUBLIC_APP_URL;
  const origin = configuredOrigin ?? (await getRequestOrigin());

  // Supabase email confirmation returns to this route with a short-lived code.
  // The route exchanges that code for app cookies, so verified users land
  // signed in instead of seeing another login screen.
  return new URL("/auth/callback?next=/dashboard", origin).toString();
}

async function getRequestOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return "http://localhost:3000";
  }

  return `${protocol}://${host}`;
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/sign-in");
}
