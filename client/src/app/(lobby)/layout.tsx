import MainHeader from "@/components/page/main/MainHeader";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-rows-[auto_1fr] w-full h-dvh">
      <MainHeader />
      {children}
    </div>
  );
}
