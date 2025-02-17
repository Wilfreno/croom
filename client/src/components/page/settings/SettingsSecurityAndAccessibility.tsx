import { Separator } from "@/components/ui/separator";
import SettingsBlockedUsers from "./SecurityAndAccessibility/SettingsBlockedUsers";
import SettingsChangePassword from "./SecurityAndAccessibility/SettingsChangePassword";
import SettingsDeleteAccount from "./SecurityAndAccessibility/SettingsDeleteAccount";

export default function SettingsSecurityAndAccessibility() {
  return (
    <section className="grid gap-4">
      <span className="text-xl font-semibold">Security & Accessibility</span>
      <div className="grid gap-4">
        <SettingsBlockedUsers />
        <SettingsChangePassword />
        <Separator />
        <SettingsDeleteAccount />
      </div>
    </section>
  );
}
