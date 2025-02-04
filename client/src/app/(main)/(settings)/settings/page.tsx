import SettingsProfile from "@/components/page/settings/SettingsChangePhoto";
import SettingsUser from "@/components/page/settings/SettingsUser";

export default function page() {
  return (
    <main className="flex flex-col p-2 gap-2">
      <SettingsUser />
      <SettingsProfile />
    </main>
  );
}
