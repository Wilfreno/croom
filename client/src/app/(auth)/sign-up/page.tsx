import SignUpForm from "@/components/page/auth/signup/SignupForm";
import { getQueryClient } from "@/lib/react-query/get-query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export default async function Page() {
  const query_client = getQueryClient();

  await query_client.prefetchQuery({
    queryKey: ["signup", "form"],
    queryFn: () => ({
      email: "",
      username: "",
      password: "",
      display_name: "",
      confirm_password: "",
      pin: "",
    }),
  });

  return (
    <section className="h-full grow flex flex-col gap-8 px-[10vw]">
      <div className="text-center">
        <h1 className="text-xl md:text-6xl md:w-[30vw] font-semibold bg-gradient-to-r from-[#7f00ff] to-[#e100ff]  bg-clip-text text-transparent">
          Welcome!
        </h1>
        <h2 className="text-sm md:text-base font-medium text-muted-foreground">Sign Up for a great experience</h2>
      </div>

      <HydrationBoundary state={dehydrate(query_client)}>
        <SignUpForm />
      </HydrationBoundary>
    </section>
  );
}
