"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SettingsChangeDisplayname from "./profile/SettingsChangeDisplayname";
import { Separator } from "@/components/ui/separator";

export default function SettingsProfile() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="p-0 pb-2 grid gap-2">
        <Separator />
        <SettingsChangeDisplayname />
      </CardContent>
    </Card>
  );
}
