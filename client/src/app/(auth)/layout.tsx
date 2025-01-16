import Image from "next/image";
import React from "react";
import landing_page_image from "../../../public/landing_page_image.png";
import Link from "next/link";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="w-full h-dvh flex flex-col gap-4 py-5">
      <header className="h-fit w-full">
        <Link href="/" className="text-4xl font-semibold text-primary mx-8">
          Chatup
        </Link>
      </header>
      <section className="h-[90dvh] w-full flex items-center">
        <div className="h-full grow overflow-hidden">
          <Image src={landing_page_image} alt="" className="h-full w-auto object-cover" />
        </div>
        {children}
      </section>
    </main>
  );
}
