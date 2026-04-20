import { createHmac, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { getServerEnv } from "@/lib/env/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const env = getServerEnv();
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  // Meta verifies webhook ownership with a GET challenge. The verify token is
  // app-defined and must be different from provider access tokens or secrets.
  if (
    mode === "subscribe" &&
    challenge &&
    env?.INSTAGRAM_WEBHOOK_VERIFY_TOKEN &&
    token === env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN
  ) {
    return new Response(challenge, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  return NextResponse.json(
    { error: "Instagram webhook verification failed." },
    { status: 403 },
  );
}

export async function POST(request: Request) {
  const env = getServerEnv();
  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  // Webhook payloads arrive outside a signed-in user session. Verify the Meta
  // signature before parsing so spoofed requests do not enter the event path.
  if (
    env?.INSTAGRAM_CLIENT_SECRET &&
    (!signature || !isValidMetaSignature({
      body,
      signature,
      secret: env.INSTAGRAM_CLIENT_SECRET,
    }))
  ) {
    return NextResponse.json(
      { error: "Invalid Instagram webhook signature." },
      { status: 401 },
    );
  }

  const payload = safeParseJson(body);

  if (!payload) {
    return NextResponse.json(
      { error: "Invalid Instagram webhook payload." },
      { status: 400 },
    );
  }

  // The endpoint is ready for Meta verification and signed delivery. Event
  // persistence is intentionally pending until comment/message workflows are
  // productized, so we acknowledge valid events without storing raw payloads.
  return NextResponse.json({ received: true });
}

function isValidMetaSignature({
  body,
  secret,
  signature,
}: {
  body: string;
  secret: string;
  signature: string;
}) {
  if (!signature.startsWith("sha256=")) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const received = signature.slice("sha256=".length);

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

function safeParseJson(body: string) {
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return null;
  }
}
