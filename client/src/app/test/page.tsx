import React from "react";
import croom_logo from "../../../public/croom-logo.svg";
import Image from "next/image";

export default function page() {
  return (
    <section className="fixed z-50 w-full h-full bg-background">
      <div className="relative">
        <Image src={croom_logo} alt="logo" className="" />
      </div>
    </section>
  );
}
