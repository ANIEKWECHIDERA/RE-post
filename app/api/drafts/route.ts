import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/server/auth/session';
import { getDraftsPageData } from '@/server/drafts/queries';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        code: 'unauthorized',
        message: 'Sign in to view drafts.',
      },
      { status: 401 },
    );
  }

  return NextResponse.json(await getDraftsPageData(user.id));
}
