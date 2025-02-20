import SettingsProfile from "@/components/page/settings/SettingsProfile";
import SettingsSecurityAndAccessibility from "@/components/page/settings/SettingsSecurityAndAccessibility";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function page() {
  return (
    <main className="md:pl-16 md:p-2">
      <Card className=" rounded-none md:rounded-md">
        <CardHeader>
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
