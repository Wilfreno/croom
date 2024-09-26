import MainHeader from "@/components/page/main/MainHeader";
import MainSideBar from "@/components/page/main/MainSideBar";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[auto_1fr] w-full h-dvh">
      <MainSideBar />
      {children}
    </div>
  );
}
