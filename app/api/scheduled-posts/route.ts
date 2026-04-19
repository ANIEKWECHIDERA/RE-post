import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/server/auth/session';
import { getScheduledPostsPageData } from '@/server/scheduled-posts/queries';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        code: 'unauthorized',
        message: 'Sign in to view scheduled posts.',
      },
      { status: 401 },
    );
  }

  return NextResponse.json(await getScheduledPostsPageData(user.id));
}
