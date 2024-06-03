import { ThemeToggler } from "@/components/dark-mode/ThemeToggler";
import LoginForm from "@/components/page/login/LoginForm";
import LoginWGoogle from "@/components/page/login/LoginWGoogle";
import auth_options from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function page() {
  const session = await getServerSession(auth_options);

  if (session) redirect("/");
  return (
    <div className="border rounded p-5  bg-primary-foreground shadow-lg relative">
      <ThemeToggler className="absolute top-1 right-2" />
      <section className="font-bold text-secondary-foreground mb-10">
        <p className="text-xl">Welcome back!</p>
        <p className="text-sm">we're excited to see you again</p>
      </section>
      <section className="flex space-x-10">
        <LoginForm />
        <div className="w-[15rem] space-y-10 flex flex-col">
          <p className="secondary-foreground mx-auto font-bold">
            Continue with
          </p>
          <div className="flex justify-start space-x-5">
            <LoginWGoogle />
          </div>
        </div>
      </section>
    </div>
  );
}
