import 'server-only';

import { getServerEnv } from '@/lib/env/server';

type WorkerTriggerResult =
  | { ok: true; claimed: number | null }
  | { ok: false; reason: 'not_configured' | 'request_failed' };

export async function triggerPublishWorkerNow(): Promise<WorkerTriggerResult> {
  const env = getServerEnv();

  if (!env?.PUBLISH_WORKER_URL || !env.PUBLISH_WORKER_SECRET) {
    return { ok: false, reason: 'not_configured' };
  }

  try {
    // Instant publishing should still go through the same server-side worker
    // trust boundary as cron. The browser never sees provider tokens, and the
    // worker keeps the same job locking, retry, and audit trail semantics.
    const response = await fetch(env.PUBLISH_WORKER_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.PUBLISH_WORKER_SECRET}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ limit: 5 }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return { ok: false, reason: 'request_failed' };
    }

    const payload = (await response.json().catch(() => null)) as
      | { result?: { claimed?: number } }
      | null;

    return { ok: true, claimed: payload?.result?.claimed ?? null };
  } catch {
    return { ok: false, reason: 'request_failed' };
  }
}
