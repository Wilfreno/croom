import MainSideBar from "@/components/page/main/MainSideBar";
import MediaDeviceProvider from "@/components/providers/MediaDeviceProvider";
import UserStreamProvider from "@/components/providers/UserStreamProvider";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <UserStreamProvider>
      <MediaDeviceProvider>
        <section className="flex">
          <MainSideBar />
          {children}
        </section>
      </MediaDeviceProvider>
    </UserStreamProvider>
  );
}
