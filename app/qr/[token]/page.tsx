import { notFound } from "next/navigation";
import { getParticipantByQrToken } from "@/lib/data/registration";
import { qrSvg } from "@/lib/qr";

export default async function ParticipantQrPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const participant = await getParticipantByQrToken(token);
  if (!participant) notFound();

  const svg = qrSvg(participant.qr_token, 320);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm">
        <div className="mb-1 text-3xl">🎟️</div>
        <h1 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Festival Check-in QR Code
        </h1>
        <p className="mt-2 text-xl font-bold text-gray-800">{participant.student_name}</p>

        <div
          className="mx-auto my-6 aspect-square w-full max-w-[260px] [&_svg]:h-full [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />

        <p className="text-sm text-gray-500">
          Show this QR code (on your phone or printed) at the check-in booth on the day of the
          event.
        </p>

        {participant.waitlisted && (
          <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
            This student is currently on the waitlist.
          </p>
        )}
      </div>
    </div>
  );
}
