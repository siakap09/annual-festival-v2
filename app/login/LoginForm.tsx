"use client";

import { useState } from "react";
import { signInWithGoogle } from "@/app/actions/auth";

export function LoginForm({ error, message }: { error?: string; message?: string }) {
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      const result = await signInWithGoogle();
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      setGoogleError(result.error ?? "Failed to start Google sign-in");
    } catch (err) {
      setGoogleError(err instanceof Error ? err.message : "Failed to start Google sign-in");
    } finally {
      setGoogleLoading(false);
    }
  }

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

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.48-1.13 2.73-2.4 3.58v2.98h3.86c2.26-2.08 3.56-5.14 3.56-8.8z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.86-2.98c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.07C3.25 21.3 7.31 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.27 14.31A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.58.38-2.31V6.62H1.28A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.28 5.38l3.99-3.07z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.28 6.62l3.99 3.07C6.22 6.86 8.87 4.75 12 4.75z"
          />
        </svg>
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </button>
      {googleError && (
        <p className="mt-2 text-center text-xs text-red-600">{googleError}</p>
      )}
    </div>
  );
}
