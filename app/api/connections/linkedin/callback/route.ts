import { handleProviderOAuthCallback } from '@/server/connections/oauth';

export async function GET(request: Request) {
  return handleProviderOAuthCallback({
    platform: 'linkedin',
    request,
  });
}
