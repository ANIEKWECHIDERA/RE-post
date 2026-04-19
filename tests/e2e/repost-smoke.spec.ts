import { expect, test, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const baseUrl = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

test.setTimeout(180_000);

function loadDotEnv() {
  const envPath = resolve(process.cwd(), '.env');

  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

function getSupabaseAdmin() {
  loadDotEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  expect(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL is required for E2E tests').toBeTruthy();
  expect(serviceRoleKey, 'SUPABASE_SERVICE_ROLE_KEY is required for E2E tests').toBeTruthy();

  return createClient(supabaseUrl!, serviceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getFutureDateTimeLocal(minutesFromNow: number) {
  const future = new Date(Date.now() + minutesFromNow * 60_000);
  const local = new Date(future.getTime() - future.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

async function createConfirmedTestUser() {
  const unique = `${Date.now()}.${test.info().workerIndex}`;
  const email = `repost.e2e.${unique}@gmail.com`;
  const password = `Repost-${Date.now()}!`;
  const admin = getSupabaseAdmin();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: 'E2E Creator',
    },
  });

  expect(error?.message).toBeFalsy();
  const userId = data.user?.id;
  expect(userId, 'test user should be created').toBeTruthy();

  return {
    admin,
    email,
    password,
    userId,
  };
}

function getPublishWorkerSecret() {
  loadDotEnv();

  const secret = process.env.PUBLISH_WORKER_SECRET;
  expect(secret, 'PUBLISH_WORKER_SECRET is required for worker E2E tests').toBeTruthy();

  return secret!;
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto(`${baseUrl}/sign-in`);

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
}

test('unauthenticated API requests are rejected safely', async ({ request }) => {
  for (const path of [
    '/api/dashboard/summary',
    '/api/drafts',
    '/api/scheduled-posts',
    '/api/analytics/summary',
  ]) {
    const response = await request.get(`${baseUrl}${path}`);
    expect(response.status(), `${path} should require auth`).toBe(401);
  }

  const workerResponse = await request.post(`${baseUrl}/api/publish/run`, {
    data: { limit: 1 },
  });
  expect(workerResponse.status()).toBe(401);
});

test('confirmed creator can sign in, compose, and navigate the app', async ({ page }) => {
  const { admin, email, password, userId } = await createConfirmedTestUser();

  try {
    await signIn(page, email, password);
    await expect(
      page.getByRole('heading', { name: 'Creator Home' }),
    ).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText('Analytics pulse')).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('link', { name: 'Compose', exact: true }).click();
    await expect(page).toHaveURL(/\/compose/, { timeout: 15_000 });
    await expect(page.getByText('Build the next post')).toBeVisible({
      timeout: 15_000,
    });

    await page
      .getByPlaceholder('What are you making visible today?')
      .fill('Testing RE-post from Playwright.');
    await page.getByRole('button', { name: /queue post/i }).click();
    await expect(page.getByRole('heading', { name: 'Saved' })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText(/post queued/i)).toBeVisible();

    await page.getByRole('link', { name: 'Schedule' }).click();
    await expect(page).toHaveURL(/\/schedule/, { timeout: 15_000 });
    await expect(page.getByText('Keep future-you covered.')).toBeVisible({
      timeout: 15_000,
    });

    await page.goto(`${baseUrl}/drafts`);
    await expect(page).toHaveURL(/\/drafts/, { timeout: 15_000 });
    await expect(page.getByText('Keep the ideas warm.')).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('link', { name: 'Analytics' }).click();
    await expect(page).toHaveURL(/\/analytics/, { timeout: 15_000 });
    await expect(
      page.getByText('Proof that consistency compounds.'),
    ).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('link', { name: /connections/i }).click();
    await expect(page).toHaveURL(/\/connections/, { timeout: 15_000 });
    await expect(page.getByText('Social accounts')).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page.getByText('Recent activity')).toBeVisible({
      timeout: 15_000,
    });
  } finally {
    if (userId) {
      await admin.auth.admin.deleteUser(userId);
    }
  }
});

test('composer rejects unsupported media before a job is queued', async ({
  page,
}) => {
  const { admin, email, password, userId } = await createConfirmedTestUser();

  try {
    await signIn(page, email, password);

    await page.getByRole('link', { name: 'Compose', exact: true }).click();
    await expect(page).toHaveURL(/\/compose/, { timeout: 15_000 });
    await page
      .getByPlaceholder('What are you making visible today?')
      .fill('Invalid media should stay out of the queue.');
    await page.locator('input[name="media"]').setInputFiles({
      name: 'not-a-social-asset.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not publishable media'),
    });
    await page.getByRole('button', { name: /queue post/i }).click();
    await expect(
      page.getByText('not-a-social-asset.txt uses an unsupported media type.'),
    ).toBeVisible({
      timeout: 30_000,
    });
  } finally {
    if (userId) {
      await admin.auth.admin.deleteUser(userId);
    }
  }
});

test('confirmed creator can save and reopen a draft', async ({ page }) => {
  const { admin, email, password, userId } = await createConfirmedTestUser();

  try {
    await signIn(page, email, password);

    await page.getByRole('link', { name: 'Compose', exact: true }).click();
    await expect(page).toHaveURL(/\/compose/, { timeout: 15_000 });
    await page
      .getByPlaceholder('What are you making visible today?')
      .fill('Draft saved from Playwright.');
    await page.getByRole('button', { name: 'Save draft' }).click();

    const draftId = await expect
      .poll(
        async () => {
          const { data } = await admin
            .from('posts')
            .select('id')
            .eq('user_id', userId!)
            .eq('status', 'draft')
            .eq('body', 'Draft saved from Playwright.')
            .maybeSingle();

          return data?.id ?? null;
        },
        { timeout: 60_000 },
      )
      .not.toBeNull()
      .then(async () => {
        const { data, error } = await admin
          .from('posts')
          .select('id')
          .eq('user_id', userId!)
          .eq('status', 'draft')
          .eq('body', 'Draft saved from Playwright.')
          .single();
        expect(error?.message).toBeFalsy();
        return data!.id;
      });

    await page.goto(`${baseUrl}/compose?draftId=${draftId}`);
    await expect(page).toHaveURL(/\/compose\?draftId=/, { timeout: 15_000 });
    await expect(
      page.getByPlaceholder('What are you making visible today?'),
    ).toHaveValue('Draft saved from Playwright.', { timeout: 15_000 });
  } finally {
    if (userId) {
      await admin.auth.admin.deleteUser(userId);
    }
  }
});

test('drafts page only shows the signed-in creator data', async ({ page }) => {
  const owner = await createConfirmedTestUser();
  const viewer = await createConfirmedTestUser();
  const hiddenBody = 'Private draft owned by another creator.';

  try {
    const { error } = await owner.admin.from('posts').insert({
      user_id: owner.userId!,
      body: hiddenBody,
      status: 'draft',
      schedule_mode: 'now',
      timezone: 'UTC',
    });
    expect(error?.message).toBeFalsy();

    await signIn(page, viewer.email, viewer.password);
    await page.goto(`${baseUrl}/drafts`);
    await expect(page).toHaveURL(/\/drafts/, { timeout: 15_000 });
    await expect(page.getByText(hiddenBody)).toHaveCount(0);
  } finally {
    if (owner.userId) {
      await owner.admin.auth.admin.deleteUser(owner.userId);
    }
    if (viewer.userId) {
      await viewer.admin.auth.admin.deleteUser(viewer.userId);
    }
  }
});

test('confirmed creator can schedule, reschedule, and cancel a post', async ({
  page,
}) => {
  const { admin, email, password, userId } = await createConfirmedTestUser();

  try {
    await signIn(page, email, password);

    await page.getByRole('link', { name: 'Compose', exact: true }).click();
    await expect(page).toHaveURL(/\/compose/, { timeout: 15_000 });
    await page
      .getByPlaceholder('What are you making visible today?')
      .fill('Scheduled lifecycle from Playwright.');
    await page.getByRole('radio', { name: 'Schedule' }).click();
    await page
      .locator('input[name="scheduledAt"]')
      .fill(getFutureDateTimeLocal(30));
    await page.getByRole('button', { name: 'Schedule post' }).click();
    await expect(page.getByText('Post scheduled.')).toBeVisible({
      timeout: 60_000,
    });

    await page.goto(`${baseUrl}/schedule`);
    await expect(page).toHaveURL(/\/schedule/, { timeout: 15_000 });
    await expect(
      page.getByText('Scheduled lifecycle from Playwright.').first(),
    ).toBeVisible({
      timeout: 15_000,
    });
    const { data: scheduledPost, error: scheduledPostError } = await admin
      .from('posts')
      .select('id')
      .eq('user_id', userId!)
      .eq('body', 'Scheduled lifecycle from Playwright.')
      .eq('status', 'scheduled')
      .single();
    expect(scheduledPostError?.message).toBeFalsy();
    expect(scheduledPost?.id).toBeTruthy();

    await page.locator('summary').filter({ hasText: 'Reschedule' }).click();
    await page
      .locator('input[name="scheduledAt"]')
      .fill(getFutureDateTimeLocal(90));
    await page.getByRole('button', { name: 'Reschedule' }).click();
    await expect(
      page.getByText('Scheduled lifecycle from Playwright.').first(),
    ).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect
      .poll(
        async () => {
          const { data } = await admin
            .from('posts')
            .select('status')
            .eq('id', scheduledPost!.id)
            .single();

          return data?.status ?? null;
        },
        { timeout: 60_000 },
      )
      .toBe('canceled');
  } finally {
    if (userId) {
      await admin.auth.admin.deleteUser(userId);
    }
  }
});

test('publish worker processes a due job without provider credentials and records a safe failure', async ({
  request,
}) => {
  const { admin, userId } = await createConfirmedTestUser();
  const workerSecret = getPublishWorkerSecret();

  try {
    const { data: post, error: postError } = await admin
      .from('posts')
      .insert({
        user_id: userId!,
        body: 'Worker safe failure from Playwright.',
        status: 'queued',
        schedule_mode: 'now',
        timezone: 'UTC',
      })
      .select('id')
      .single();
    expect(postError?.message).toBeFalsy();
    expect(post?.id).toBeTruthy();

    const { data: target, error: targetError } = await admin
      .from('post_platform_targets')
      .insert({
        user_id: userId!,
        post_id: post!.id,
        platform: 'linkedin',
        status: 'pending',
        platform_body: 'Worker safe failure from Playwright.',
      })
      .select('id')
      .single();
    expect(targetError?.message).toBeFalsy();
    expect(target?.id).toBeTruthy();

    const { error: jobError } = await admin.from('publish_jobs').insert({
      user_id: userId!,
      post_id: post!.id,
      status: 'queued',
      run_at: '2000-01-01T00:00:00.000Z',
      idempotency_key: `e2e:${post!.id}:${Date.now()}`,
    });
    expect(jobError?.message).toBeFalsy();

    const response = await request.post(`${baseUrl}/api/publish/run`, {
      headers: {
        authorization: `Bearer ${workerSecret}`,
      },
      data: { limit: 1 },
    });
    expect(response.status()).toBe(200);
    const payload = (await response.json()) as {
      ok?: boolean;
      result?: { processed?: number; failed?: number };
    };
    expect(payload.ok).toBe(true);
    expect(payload.result?.processed).toBeGreaterThanOrEqual(1);
    expect(payload.result?.failed).toBeGreaterThanOrEqual(1);

    const { data: updatedTarget, error: updatedTargetError } = await admin
      .from('post_platform_targets')
      .select('status,last_error_code')
      .eq('id', target!.id)
      .single();
    expect(updatedTargetError?.message).toBeFalsy();
    expect(updatedTarget?.status).toBe('failed');
    expect(updatedTarget?.last_error_code).toBe('connection_missing');
  } finally {
    if (userId) {
      await admin.auth.admin.deleteUser(userId);
    }
  }
});
