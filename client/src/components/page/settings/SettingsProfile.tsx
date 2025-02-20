"use client";
import SettingsChangeDisplayname from "./profile/SettingsChangeDisplayname";
import SettingsChangeUserName from "./profile/SettingsChangeUserName";
import SettingsChangePhoto from "./profile/SettingsChangePhoto";

export default function SettingsProfile() {
  return (
    <section className="grid gap-4">
      <span className="text-xl font-semibold">Profile</span>
      <div className="grid gap-4 md:gap-8">
        <SettingsChangePhoto />
        <SettingsChangeDisplayname />
        <SettingsChangeUserName />
      </div>
    </section>
  );
}
