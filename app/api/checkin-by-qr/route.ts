export const runtime = "edge";

import { NextResponse } from "next/server";
import { checkInByQrToken } from "@/app/actions/registration";

/**
 * Plain Route Handler for the camera-scan check-in flow, rather than
 * calling the Server Action directly from the client. Server Actions use
 * Next's own RSC wire protocol for the request/response, which can fail in
 * ways that only surface as a generic "unexpected response" error with no
 * further detail (e.g. if something in front of the Worker -- Cloudflare's
 * own layer -- intercepts/alters the response). A plain fetch() with a
 * normal JSON response is easier to debug and less likely to hit that.
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  try {
    const message = await checkInByQrToken(formData);
    return NextResponse.json({ ok: true, message });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Something went wrong." },
      { status: 400 }
    );
  }
}
