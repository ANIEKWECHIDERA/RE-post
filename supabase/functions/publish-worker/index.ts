type WorkerRequestBody = {
  limit?: number;
};

const workerUrl = Deno.env.get('PUBLISH_WORKER_URL');
const workerSecret = Deno.env.get('PUBLISH_WORKER_SECRET');

Deno.serve(async request => {
  if (request.method !== 'POST') {
    return json({ ok: false, message: 'Method not allowed.' }, 405);
  }

  if (!workerUrl || !workerSecret) {
    return json(
      {
        ok: false,
        message: 'Publish worker URL or secret is not configured.',
      },
      503,
    );
  }

  const body = await safeJson(request);
  const limit = normalizeLimit(body.limit);

  // This Edge Function is the Supabase Cron target. It forwards to the
  // Next.js worker so the publishing engine has one execution path whether it
  // is triggered manually, by cron, or by a future queue runner.
  const response = await fetch(workerUrl, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${workerSecret}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ limit }),
  });

  const payload = await safeJson(response);

  return json(
    {
      ok: response.ok,
      workerStatus: response.status,
      payload,
    },
    response.ok ? 200 : 502,
  );
});

function normalizeLimit(limit: unknown) {
  const parsed = Number(limit);

  if (!Number.isInteger(parsed)) {
    return 5;
  }

  return Math.min(25, Math.max(1, parsed));
}

async function safeJson(
  request: Request | Response,
): Promise<WorkerRequestBody> {
  try {
    return (await request.json()) as WorkerRequestBody;
  } catch {
    return {};
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}
