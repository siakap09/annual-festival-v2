"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

/** Live camera-based QR scanner for check-in. Requests the rear camera,
 * continuously scans video frames via jsQR (pure client-side, no
 * dependency on the Edge Runtime this app's server code otherwise runs
 * under), and checks the student in as soon as a QR code resolves to a
 * known participant. */
export function QrScanner({
  checkpoint,
  path,
  onResult,
  disabled,
}: {
  checkpoint: number;
  path: string;
  onResult: (message: string) => void;
  disabled?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const cooldownRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          // Keeping the requested resolution modest (rather than the
          // camera's native resolution, which can be several thousand
          // pixels wide on modern phones) keeps every decode pass fast --
          // full native resolution made scanning noticeably sluggish/
          // unreliable without any benefit, since a QR code doesn't need
          // high resolution to decode.
          video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setReady(true);
        scanLoop();
      } catch (err) {
        setError(
          err instanceof Error && err.name === "NotAllowedError"
            ? "Camera access denied. Allow camera permission for this site and try again."
            : "Couldn't access the camera on this device."
        );
      }
    }

    function scanLoop() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(scanLoop);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        rafRef.current = requestAnimationFrame(scanLoop);
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && !cooldownRef.current) {
        cooldownRef.current = true;
        handleScan(code.data).finally(() => {
          // Brief cooldown so the same still-visible QR doesn't get
          // resubmitted dozens of times a second while it's in frame.
          setTimeout(() => {
            cooldownRef.current = false;
          }, 2000);
        });
      }

      rafRef.current = requestAnimationFrame(scanLoop);
    }

    async function handleScan(token: string) {
      const formData = new FormData();
      formData.set("qr_token", token);
      formData.set("checkpoint", String(checkpoint));
      formData.set("path", path);
      try {
        const res = await fetch("/api/checkin-by-qr", { method: "POST", body: formData });
        const text = await res.text();
        let json: { ok?: boolean; message?: string; error?: string } | null = null;
        try {
          json = JSON.parse(text);
        } catch {
          // Not JSON at all -- show the raw status/body so this is
          // diagnosable from the phone screen without needing DevTools.
          onResult(`⚠️ Unexpected response (HTTP ${res.status}): ${text.slice(0, 300) || "(empty body)"}`);
          return;
        }
        if (json?.ok) {
          onResult(`✅ ${json.message}`);
        } else {
          onResult(json?.error ?? `Request failed (HTTP ${res.status}).`);
        }
      } catch (err) {
        onResult(`Network error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkpoint, path]);

  if (error) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-1 rounded-md bg-black/40 p-3 text-center text-xs text-indigo-100">
        <span className="text-2xl">🚫</span>
        {error}
      </div>
    );
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-md bg-black">
      <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
      <canvas ref={canvasRef} className="hidden" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-indigo-100">
          Starting camera...
        </div>
      )}
      {disabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-white">
          Checking in...
        </div>
      )}
    </div>
  );
}
