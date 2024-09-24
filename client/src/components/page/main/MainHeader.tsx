import Link from "next/link";
import Notification from "./Notification";

export default function MainHeader() {
  return (
    <header className="flex items-center justify-between w-full py-4 px-8">
      <Link href="/">
        <h1 className="text-3xl text-primary font-bold whitespace-nowrap">
          Chat Up
        </h1>
      </Link>
      <Notification />
    </header>
  );
}
