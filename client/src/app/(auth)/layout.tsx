import Link from "next/link";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="w-full h-dvh flex flex-col gap-4 py-5">
      <header className="h-fit w-full text-center md:text-start">
        <Link href="/" className="text-4xl font-semibold text-primary mx-8">
          Chatup
        </Link>
      </header>
      {children}
    </main>
  );
}
