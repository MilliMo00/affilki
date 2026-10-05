import { NextResponse, type NextRequest } from "next/server";
import { sessionToken } from "@/lib/voting/cookies";
import { findSession } from "@/lib/voting/login";
import { describeVoter } from "@/lib/voting/me";

export async function GET(request: NextRequest) {
  const session = await findSession(sessionToken(request));
  return NextResponse.json(session ? await describeVoter(session) : { user: null, votes: {} });
}
