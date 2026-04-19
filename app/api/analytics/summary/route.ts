import { NextResponse } from 'next/server';

import { getAnalyticsPageData } from '@/server/analytics/queries';
import { getCurrentUser } from '@/server/auth/session';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        code: 'unauthorized',
        message: 'Sign in to view analytics.',
      },
      { status: 401 },
    );
  }

  return NextResponse.json(await getAnalyticsPageData(user.id));
}
