"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 p-6 text-center">
      <p className="text-lg font-semibold text-gray-800">Something went wrong</p>
      <p className="max-w-md text-sm text-gray-500">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
      >
        Try again
      </button>
    </div>
  );
}
