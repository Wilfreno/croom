import MainSideBar from "@/components/page/main/MainSideBar";
import MediaStreamProvider from "@/components/providers/RTCPeerConnectionProvider";
import UserStreamProvider from "@/components/providers/UserStreamProvider";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <UserStreamProvider>
      <MediaStreamProvider>
        <section className="flex">
          <MainSideBar />
          {children}
        </section>
      </MediaStreamProvider>
    </UserStreamProvider>
  );
}
