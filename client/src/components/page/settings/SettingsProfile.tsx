"use client";
import SettingsChangeDisplayname from "./profile/SettingsChangeDisplayname";
import SettingsChangeUserName from "./profile/SettingsChangeUserName";

export default function SettingsProfile() {
  return (
    <section className="pl-8 p-4 grid gap-2 border-t">
      <h1 className=" font-semibold">Profile</h1>
      <div className="p-0 pb-2 grid gap-2">
        <SettingsChangeDisplayname />
        <SettingsChangeUserName />
      </div>
    </section>
  );
}
