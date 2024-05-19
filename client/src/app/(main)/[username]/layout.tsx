import MainLeftSideBar from "@/components/page/main/MainLeftSideBar";
import MainRightSideBar from "@/components/page/main/MainRightSideBar";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grow flex">
      <MainLeftSideBar />
      {children}
      <MainRightSideBar />
    </main>
  );
}
