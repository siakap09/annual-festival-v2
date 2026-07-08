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

export async function signInWithGoogle() {
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
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "Failed to start Google sign-in")}`);
  }
  redirect(data.url);
}

export async function logout() {
  if (isDemo()) {
    redirect("/editions");
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
