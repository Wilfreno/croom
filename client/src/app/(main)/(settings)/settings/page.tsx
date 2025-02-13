import SettingsProfile from "@/components/page/settings/SettingsProfile";
import SettingsSecurityAndAccessibility from "@/components/page/settings/SettingsSecurityAndAccessibility";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function page() {
  return (
    <main className="pl-16 p-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <SettingsProfile />
          <SettingsSecurityAndAccessibility />
        </CardContent>
      </Card>
    </main>
  );
}
