import { AdminLoginForm } from "@/components/admin/login-form";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(8,189,255,0.15),transparent_32rem),#020b1f] px-4">
      <AdminLoginForm />
    </main>
  );
}
