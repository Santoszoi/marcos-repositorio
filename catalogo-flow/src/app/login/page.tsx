import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import Brand from "@/components/Brand";
import AuthForm from "@/components/AuthForm";
export const dynamic = "force-dynamic";
export default async function LoginPage() {
  if (await currentUser()) redirect("/dashboard");
  return (
    <>
      <header className="shell auth-header">
        <Brand />
      </header>
      <main className="auth-page">
        <AuthForm />
      </main>
    </>
  );
}
