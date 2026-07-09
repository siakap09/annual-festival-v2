"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { assertNotDemo, isDemo } from "@/lib/demo";

export async function login(formData: FormData) {
  assertNotDemo();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/editions");
}

export async function signup(formData: FormData) {
  assertNotDemo();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/login?message=${encodeURIComponent("Check your email to confirm your account, then sign in.")}`);
}

export async function signInWithGoogle(): Promise<{ url?: string; error?: string }> {
  assertNotDemo();
  const supabase = await createClient();
  const headerList = await headers();
  const origin = headerList.get("origin") ?? `https://${headerList.get("host")}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error || !data.url) {
    return { error: error?.message ?? "Failed to start Google sign-in" };
  }

  // Return the URL instead of calling redirect() here: @cloudflare/next-on-pages
  // cannot handle a Server Action calling redirect() with an external absolute
  // URL (confirmed via isolated local repro -- fails identically for any
  // external target, not just this one). The caller navigates client-side
  // instead via window.location.href.
  return { url: data.url };
}

export async function logout() {
  if (isDemo()) {
    redirect("/editions");
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
