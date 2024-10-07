import Link from "next/link";
import Notification from "./Notifications";

export default function MainHeader() {
  return (
    <header className="sticky top-0 flex items-center justify-between w-full py-2 px-5">
      <Link href="/">
        <h1 className="text-3xl text-primary font-bold whitespace-nowrap">
          Chat Up
        </h1>
      </Link>
      <Notification />
    </header> 
  );
}
