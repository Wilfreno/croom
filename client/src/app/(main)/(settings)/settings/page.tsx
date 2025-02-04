"use client";
import SettingsProfile from "@/components/page/settings/SettingsProfile";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { UserRound } from "lucide-react";

export default function Page() {
  const { session } = useAuth();
  return (
    <main className="p-2">
      <Card className="h-fit">
        <CardContent className="p-0 grid gap-2">
          <header className="flex items-center gap-2 p-8">
            <Avatar className="aspect-square h-14 w-auto">
              <AvatarImage src={session.user?.photo?.url} />
              <AvatarFallback>
                <UserRound className="h-1/2 w-auto" />
              </AvatarFallback>
            </Avatar>
            <div className="grid items-start gap-1">
              <span className="text-lg font-semibold leading-none">
                {session.user?.display_name.toUpperCase()}
              </span>
              <span className="leading-none">{session.user?.username}</span>
            </div>
          </header>
          <SettingsProfile />
        </CardContent>
      </Card>
    </main>
  );
}
