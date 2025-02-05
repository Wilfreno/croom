import SettingsProfile from "@/components/page/settings/SettingsProfile";
import { Card, CardContent } from "@/components/ui/card";

export default function page() {
  return (
    <main className="p-2">
      <Card className="h-fit">
        <CardContent className="p-0 grid pb-4">
          <header className="flex items-center gap-2 p-8">
            <span className="text-3xl font-semibold">Settings</span>
          </header>
          <SettingsProfile />
        </CardContent>
      </Card>
    </main>
  );
}
