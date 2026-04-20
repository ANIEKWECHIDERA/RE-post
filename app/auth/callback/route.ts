import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));
  const redirectUrl = new URL(next, requestUrl.origin);

  if (!code) {
    redirectUrl.pathname = "/sign-in";
    redirectUrl.searchParams.set("message", "verification_link_invalid");
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirectUrl.pathname = "/sign-in";
    redirectUrl.searchParams.set("message", "supabase_not_configured");
    return NextResponse.redirect(redirectUrl);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirectUrl.pathname = "/sign-in";
    redirectUrl.searchParams.set("message", "verification_failed");
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.redirect(redirectUrl);
}

function getSafeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}
