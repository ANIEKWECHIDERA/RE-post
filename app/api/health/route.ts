import { NextResponse } from 'next/server';

import { isSupabaseConfigured } from '@/lib/env/public';

export function GET() {
  return NextResponse.json({
    ok: true,
    app: 're-post-v2',
    phase: 10,
    supabaseConfigured: isSupabaseConfigured(),
  });
}
