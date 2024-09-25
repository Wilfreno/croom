import InviteLink from "@/components/page/main/InviteLink";
import RecentLobbies from "@/components/page/main/RecentLobbies";

export default function Page() {
  return (
    <main className="p-10 grid grid-rows-[auto_1fr] gap-10">
      <InviteLink />
      <RecentLobbies />
    </main>
  );
}
