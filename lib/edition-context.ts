import { cookies } from "next/headers";
import { CURRENT_EDITION_COOKIE } from "@/lib/constants";

export async function getCurrentEditionIdCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(CURRENT_EDITION_COOKIE)?.value ?? null;
}
