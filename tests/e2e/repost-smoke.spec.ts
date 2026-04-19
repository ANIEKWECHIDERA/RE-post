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

async function signIn(page: Page, email: string, password: string) {
  await page.goto(`${baseUrl}/sign-in`);

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
}

test('confirmed creator can sign in, compose, and navigate the app', async ({ page }) => {
  const { admin, email, password, userId } = await createConfirmedTestUser();

  try {
    await signIn(page, email, password);
    await expect(page.getByText('Keep the streak alive.')).toBeVisible({
      timeout: 15_000,
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
    await expect(page.getByText('Draft saved.')).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole('link', { name: 'Drafts' }).click();
    await expect(page).toHaveURL(/\/drafts/, { timeout: 15_000 });
    await expect(page.getByText('Draft saved from Playwright.')).toBeVisible({
      timeout: 15_000,
    });

    const editHref = await page
      .getByRole('link', { name: 'Edit' })
      .first()
      .getAttribute('href');
    expect(editHref).toContain('/compose?draftId=');
    await page.goto(`${baseUrl}${editHref}`);
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
    await expect(page.getByText('canceled', { exact: true })).toBeVisible({
      timeout: 45_000,
    });
  } finally {
    if (userId) {
      await admin.auth.admin.deleteUser(userId);
    }
  }
});
