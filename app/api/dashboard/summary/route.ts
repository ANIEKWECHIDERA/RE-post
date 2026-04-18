import { NextResponse } from "next/server";

import { getCurrentUser } from "@/server/auth/session";
import { getDashboardSummary } from "@/server/dashboard/queries";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        code: "unauthorized",
        message: "Sign in to view dashboard data.",
      },
      { status: 401 },
    );
  }

  const summary = await getDashboardSummary(user.id);

  return NextResponse.json(summary);
}
