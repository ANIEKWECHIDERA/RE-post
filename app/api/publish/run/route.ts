import { timingSafeEqual } from 'node:crypto';

import { NextRequest, NextResponse } from 'next/server';

import { getServerEnv } from '@/lib/env/server';
import { publishWorkerRunSchema } from '@/schemas/publishing';
import { runPublishEngine } from '@/server/publishing/engine';

export async function POST(request: NextRequest) {
  const env = getServerEnv();

  if (!env?.PUBLISH_WORKER_SECRET) {
    return NextResponse.json(
      {
        code: 'worker_not_configured',
        message: 'The publish worker secret is not configured.',
      },
      { status: 503 },
    );
  }

  if (!hasValidWorkerSecret(request, env.PUBLISH_WORKER_SECRET)) {
    return NextResponse.json(
      {
        code: 'unauthorized',
        message: 'Publish worker authorization failed.',
      },
      { status: 401 },
    );
  }

  const body = await safeJson(request);
  const parsed = publishWorkerRunSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        code: 'validation_failed',
        message:
          parsed.error.issues[0]?.message ?? 'Invalid publish worker request.',
      },
      { status: 400 },
    );
  }

  try {
    // This route is the trust boundary for cron, a background worker, or a
    // future Supabase Edge Function. It uses the service-role engine server-side
    // so provider tokens and final publish payloads never reach the browser.
    const result = await runPublishEngine({ limit: parsed.data.limit });

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch {
    return NextResponse.json(
      {
        code: 'publish_worker_failed',
        message:
          'Publish jobs could not be processed. Check server logs and migrations.',
      },
      { status: 500 },
    );
  }
}

function hasValidWorkerSecret(request: NextRequest, expectedSecret: string) {
  const providedSecret = getProvidedSecret(request);

  if (!providedSecret) {
    return false;
  }

  const expected = Buffer.from(expectedSecret);
  const provided = Buffer.from(providedSecret);

  return (
    expected.length === provided.length && timingSafeEqual(expected, provided)
  );
}

function getProvidedSecret(request: NextRequest) {
  const headerSecret = request.headers.get('x-publish-worker-secret');
  const authorization = request.headers.get('authorization');

  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim();
  }

  return headerSecret?.trim() ?? null;
}

async function safeJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
