import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <LoginForm />
    </div>
  );
}
