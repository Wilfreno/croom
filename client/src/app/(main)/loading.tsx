"use client";
import LoadingSvg from "@/components/svg/LoadingSvg";

export default function loading() {
  return (
    <section className="w-screen h-screen fixed top-0 left-0 grid place-content-center">
      <LoadingSvg className="h-[10dvh] fill-primary" />
    </section>
  );
}
