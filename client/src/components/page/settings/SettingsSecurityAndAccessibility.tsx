import SettingsChangePassword from "./SecurityAndAccessibility/SettingsChangePassword";

export default function SettingsSecurityAndAccessibility() {
  return (
    <section className="grid gap-4">
      <span className="text-xl font-semibold">Security & Accessibility</span>
      <div className="grid gap-8">
        <SettingsChangePassword />
      </div>
    </section>
  );
}
