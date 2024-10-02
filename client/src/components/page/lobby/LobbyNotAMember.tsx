import { Button } from "@/components/ui/button";
import { Snail } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LobbyNotAMember() {
  const router = useRouter();
  return (
    <main className="w-full h-full flex flex-col items-center justify-center text-center">
      <Snail className="h-32 w-auto stroke-1 stroke-muted-foreground" />
      <p className="text-muted-foreground font-medium">
        You are not member of this lobby
      </p>
      <Button
        variant="outline"
        onClick={() => router.push("/@me")}
        className="my-12"
      >
        Go home
      </Button>
    </main>
  );
}
