import LoginForm from "@/components/page/auth/login/LoginFrom";
import LoginWGoogle from "@/components/page/auth/login/LoginGoogle";
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
    <main className="w-full h-dvh flex flex-col items-center justify-center gap-16">
      <h1 className="text-6xl font-bold">ChatUp</h1>
      <Card>
        <CardHeader className="p-1">
          <CardHeader>
            <CardTitle className="text-xl">Welcome back!</CardTitle>
            <CardDescription className="font-medium">
              we&apos;re excited to see you again
            </CardDescription>
          </CardHeader>
        </CardHeader>
        <CardContent className="flex space-x-10">
          <LoginForm />
          <div className="w-[15rem] space-y-10 flex flex-col">
            <p className="secondary-foreground mx-auto font-bold">
              Continue with
            </p>  
            <div className="flex justify-start space-x-5">
              <LoginWGoogle />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              as="/sign-up"
              prefetch
              className="text-primary"
            >
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
