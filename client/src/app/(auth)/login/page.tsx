import LoginForm from "@/components/page/auth/login/LoginFrom";
import LoginWGoogle from "@/components/page/auth/login/LoginGoogle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
        <span className="grid gap-4">
          <LoginForm />
          <LoginWGoogle />
        </span>
        <span className="text-sm">
          Don&apos;t have an account?
          <Link href="/sign-up" as="/sign-up" prefetch className="text-primary">
            <Button variant="link">Sign Up</Button>
          </Link>
        </span>
      </section>
    </main>
  );
}
