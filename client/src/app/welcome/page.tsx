import AuthButtons from "@/components/page/welcome/AuthButtons";
import { PartyPopper } from "lucide-react";

export default function page() {
  return (
    <main className="w-full h-dvh grid place-items-center">
      <section className="grid gap-16 justify-center">
        <div className="grid gap-8 text-center relative">
          <h1 className="text-8xl font-bold text-primary">Croom</h1>
          <h2 className="text-muted-foreground font-medium">Connect and Hangout with your friends and Communities</h2>
          <PartyPopper className="h-10 w-auto absolute bottom-full right-0 text-primary" />
        </div>
        <AuthButtons />
      </section>
    </main>
  );
}
