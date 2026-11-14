import Image from "next/image";
import React from "react";
import landingPageImage from "../../../../public/landing_page_image.png";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex-1 min-h-0 w-full flex">
      <div className="hidden lg:block lg:w-1/2 h-full overflow-hidden">
        <Image src={landingPageImage} alt="" sizes="50vw" priority className="h-full w-full object-contain" />
      </div>
      {children}
    </section>
  );
}
