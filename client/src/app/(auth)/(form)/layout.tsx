import Image from "next/image";
import React from "react";
import landing_page_image from "../../../../public/landing_page_image.png";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="h-[90dvh] w-full flex items-center">
      <div className="h-full grow overflow-hidden hidden md:block">
        <Image src={landing_page_image} alt="" className="h-full w-auto object-cover" />
      </div>
      {children}
    </section>
  );
}
