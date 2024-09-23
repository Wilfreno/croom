import { Snail } from "lucide-react";

export default function RecentLobbies() {
  return (
    <div className="grow h-full grid grid-rows-[auto_1fr]">
      <h1 className="text-2xl font-semibold">Recent Lobbies</h1>
      <div className="h-full w-full flex ">
        <span className="m-auto text-center text-muted-foreground font-medium grid">
          <Snail className="h-24 w-auto stroke-muted-foreground stroke-1 mx-auto" />
          <p>There&apos;s nothing to see here</p>
        </span>
      </div>
    </div>
  );
}
