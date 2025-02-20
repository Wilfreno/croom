import LoginContent from "@/components/page/auth/login/LoginContent";

export default function page() {
  return (
    <section className="h-full grow flex flex-col gap-10 md:px-[10vw]">
      <div className="space-y-4 hidden md:block">
        <h1 className="text-6xl text-start w-[30vw] font-semibold bg-gradient-to-r from-[#7f00ff] to-[#e100ff]  bg-clip-text text-transparent">
          Connect and Chat with your friends and Communities
        </h1>
        <h2 className="text-muted-foreground font-medium">
          <span className="font-bold">Welcome! </span>
          we&apos;re excited to see you
        </h2>
      </div>
      <LoginContent />
    </section>
  );
}
