import { LoginForm } from "@/components/admin/login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: { searchParams: { denied?: string } }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="card w-full max-w-sm p-8">
        <p className="eyebrow mb-2">Admin</p>
        <h1 className="mb-6 text-2xl">Sign in</h1>
        <LoginForm denied={Boolean(searchParams.denied)} />
      </div>
    </div>
  );
}
