import { AlertCircle, CheckCircle2, Link2, ShieldCheck } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { platformLabels, type Platform } from '@/schemas/platform';
import type { getConnectionPageData } from '@/server/connections/queries';
import {
  PrepareConnectionForm,
  RevokeConnectionForm,
} from '@/features/connections/components/connection-action-form';
import type { SocialConnectionStatus } from '@/types/database';

type ConnectionsPageData = Awaited<ReturnType<typeof getConnectionPageData>>;

export function ConnectionsDashboard({ data }: { data: ConnectionsPageData }) {
  return (
    <section className="grid gap-6">
      <Card className="rounded-lg shadow-soft">
        <CardHeader>
          <Badge className="w-fit rounded-md" variant="outline">
            Connections
          </Badge>
          <CardTitle className="text-3xl">Social accounts</CardTitle>
          <CardDescription>
            Provider differences stay explicit. Tokens are server-only and
            encrypted before storage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>OAuth callbacks are live</AlertTitle>
            <AlertDescription>
              Secure state verification, callback token exchange, and encrypted
              token persistence are wired. You may be asked to log in with the
              provider before consent; if your RE-post session expires during
              that external flow, sign in again and return here to confirm the
              connection status.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {data.providers.map(provider => {
          const connection = data.connections.find(
            item => item.platform === provider.platform,
          );
          const ready = provider.status === 'ready_for_oauth';
          const canUseConnection = connection
            ? isUsableConnectionStatus(connection.status)
            : false;

          return (
            <Card className="rounded-lg shadow-soft" key={provider.platform}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3">
                  {provider.name}
                  <ProviderStatusBadge
                    ready={ready}
                    connectionStatus={connection?.status}
                  />
                </CardTitle>
                {/* <CardDescription>
                  Scopes: {provider.scopes.join(', ')}
                </CardDescription> */}
              </CardHeader>
              <CardContent className="grid gap-4">
                {connection && canUseConnection ? (
                  <div className="grid gap-2 rounded-lg border p-3 text-sm">
                    <p className="font-medium">
                      {connection.displayName ??
                        platformLabels[connection.platform]}
                    </p>
                    <p className="text-muted-foreground">
                      {connection.handle ?? 'Handle pending'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Status: {connection.status}
                    </p>
                    <RevokeConnectionForm connectionId={connection.id} />
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {connection ? (
                      <div className="rounded-lg border border-dashed p-3 text-sm">
                        <p className="font-medium">
                          Previous {provider.name} connection is{' '}
                          {connection.status}.
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          Tokens were cleared, so start a fresh provider login
                          to reconnect this account.
                        </p>
                      </div>
                    ) : null}
                    <PrepareConnectionForm
                      disabled={!ready}
                      platform={provider.platform as Platform}
                      providerName={provider.name}
                    />
                  </div>
                )}

                {!ready ? (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Add {provider.clientIdEnv} and {provider.clientSecretEnv} to
                    enable OAuth preparation.
                  </p>
                ) : (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Link2 className="h-3.5 w-3.5" />
                    Credentials found. This starts the provider OAuth redirect.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function isUsableConnectionStatus(status: SocialConnectionStatus) {
  return status === 'active' || status === 'pending';
}

function ProviderStatusBadge({
  ready,
  connectionStatus,
}: {
  ready: boolean;
  connectionStatus?: string;
}) {
  if (connectionStatus === 'active') {
    return (
      <Badge className="rounded-md">
        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
        active
      </Badge>
    );
  }

  if (connectionStatus === 'revoked') {
    return (
      <Badge className="rounded-md" variant="outline">
        revoked
      </Badge>
    );
  }

  if (connectionStatus === 'expired' || connectionStatus === 'error') {
    return (
      <Badge className="rounded-md" variant="destructive">
        {connectionStatus}
      </Badge>
    );
  }

  return (
    <Badge className="rounded-md" variant={ready ? 'secondary' : 'outline'}>
      {ready ? 'configured' : 'missing config'}
    </Badge>
  );
}
