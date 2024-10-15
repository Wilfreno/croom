import MainHeader from "@/components/page/main/MainHeader";
import MainSideBar from "@/components/page/main/MainSideBar";
import MediaDeviceProvider from "@/components/providers/MediaDeviceProvider";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <MediaDeviceProvider>
      <section className="flex">
        <MainSideBar />
        {children}
      </section>
    </MediaDeviceProvider>
  );
}
