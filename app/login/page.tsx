import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-gray-50 p-4">
      <LoginForm error={params.error} message={params.message} />
    </div>
  );
}
