"use client";
import SettingsProfile from "@/components/page/settings/SettingsProfile";
import SettingsSecurityAndAccessibility from "@/components/page/settings/SettingsSecurityAndAccessibility";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  return (
    <main className="md:pl-16 md:p-2">
      <Card className=" rounded-none md:rounded-md">
        <CardHeader className="flex flex-row items-center gap-4 px-4">
          <Button
            variant="ghost"
            className="aspect-square h-fit w-auto p-1 md:hidden"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="h-4 w-auto" />
          </Button>
          <CardTitle className="text-3xl">Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-8">
          <SettingsProfile />
          <SettingsSecurityAndAccessibility />
        </CardContent>
      </Card>
    </main>
  );
}
