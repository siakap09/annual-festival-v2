"use client";

import { useState } from "react";
import { login, signup } from "@/app/actions/auth";
import { Field, Input } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";

export function LoginForm({ error, message }: { error?: string; message?: string }) {
  const [mode, setMode] = useState<"login" | "signup">("login");

  return (
    <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <span className="text-2xl">🎪</span>
        <span className="text-lg font-bold text-gray-900">Annual Showcase</span>
      </div>

      {message && (
        <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>
      )}
      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <form action={mode === "login" ? login : signup} className="space-y-4">
        <Field label="Email" required>
          <Input type="email" name="email" placeholder="you@example.com" required />
        </Field>
        <Field label="Password" required>
          <Input type="password" name="password" placeholder="••••••••" minLength={6} required />
        </Field>
        <Button type="submit" className="w-full justify-center">
          {mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        className="mt-4 w-full text-center text-sm text-orange-600 hover:underline"
      >
        {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
