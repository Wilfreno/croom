import Link from "next/link";

export default function MainHeader() {
  return (
    <header className="w-full shadow-md">
      <Link href="/">
        <h1 className="text-2xl text-primary font-bold whitespace-nowrap">
          Chat Up
        </h1>
      </Link>
    </header>
  );
}
