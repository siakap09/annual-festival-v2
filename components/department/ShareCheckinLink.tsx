"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ShareCheckinLink({ url, qrDataUrl }: { url: string; qrDataUrl: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Share Check-in Link with Staff
      </h3>
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="Check-in QR code" className="h-24 w-24 rounded border border-gray-100" />
        <div className="flex-1">
          <div className="text-xs text-gray-400">Staff scanner URL</div>
          <div className="break-all text-sm text-blue-600">{url}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="indigo"
              className="!px-3 !py-1.5 text-xs"
              onClick={async () => {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? "Copied!" : "📋 Copy URL"}
            </Button>
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
              Open ↗
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              🖨️ Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
