import LoginSignUpButton from "@/components/page/main/LoginSignUpButton";
import { PartyPopper } from "lucide-react";

export default function Page() {
  return (
    <main className="grid place-items-center">
      <div className="grid gap-8 text-center relative">
        <h1 className="text-8xl font-bold text-primary">Chat Up</h1>
        <h2 className="text-muted-foreground font-medium">
          Connect and Hangout with your friends and Communities
        </h2>
        <PartyPopper className="h-10 w-auto absolute bottom-full right-0 text-primary" />
        <LoginSignUpButton />
      </div>
    </main>
  );
}
