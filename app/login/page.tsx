import { redirect } from "next/navigation";
import { isDemo } from "@/lib/demo";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  if (isDemo()) redirect("/editions");

  const params = await searchParams;
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-gray-50 p-4">
      <LoginForm error={params.error} message={params.message} />
    </div>
  );
}
