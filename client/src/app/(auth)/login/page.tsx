import LoginContent from "@/components/page/auth/login/LoginContent";
import LoginForm from "@/components/page/auth/login/LoginForm";
import LoginWGoogle from "@/components/page/auth/login/LoginGoogle";
import { Button } from "@/components/ui/button";

import Link from "next/link";

export default async function Page() {
  return (
    <main className="w-full h-dvh grid place-items-center">
      <section className="grid text-center gap-8">
        <span className="text-center space-y-4">
          <h1 className="text-6xl font-bold text-center text-primary">
            ChatUp
          </h1>
          <h2 className="font-medium text-muted-foreground">
            <strong>Welcome!</strong> we&apos;re excited to see you
          </h2>
        </span>
        <LoginContent />
      </section>
    </main>
  );
}
