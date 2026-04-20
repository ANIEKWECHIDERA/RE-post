"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import type { Platform } from "@/schemas/platform";
import {
  prepareConnectionAction,
  revokeConnectionAction,
  type ConnectionActionState,
} from "@/server/connections/actions";

const initialState: ConnectionActionState = {
  ok: false,
  message: "",
};

export function PrepareConnectionForm({
  platform,
  disabled,
  providerName,
}: {
  platform: Platform;
  disabled: boolean;
  providerName: string;
}) {
  const [state, action, pending] = useActionState(prepareConnectionAction, initialState);

  return (
    <form action={action} className="grid gap-2">
      <input name="platform" type="hidden" value={platform} />
      <Button className="rounded-md" disabled={disabled || pending} type="submit">
        {pending ? `Opening ${providerName}...` : `Connect ${providerName}`}
      </Button>
      <p className="text-xs leading-5 text-muted-foreground">
        Opens {providerName} in this tab, then returns to RE-post after approval.
      </p>
      {state.message ? (
        <p className={state.ok ? "text-xs text-primary" : "text-xs text-destructive"}>{state.message}</p>
      ) : null}
    </form>
  );
}

export function RevokeConnectionForm({ connectionId }: { connectionId: string }) {
  const [state, action, pending] = useActionState(revokeConnectionAction, initialState);

  return (
    <form action={action} className="grid gap-2">
      <input name="connectionId" type="hidden" value={connectionId} />
      <Button className="rounded-md" disabled={pending} type="submit" variant="outline">
        {pending ? "Revoking..." : "Revoke"}
      </Button>
      {state.message ? (
        <p className={state.ok ? "text-xs text-primary" : "text-xs text-destructive"}>{state.message}</p>
      ) : null}
    </form>
  );
}
