import Controls from '@/components/page/call/Controls';
import RemoteParticipants from '@/components/page/call/RemoteParticipants';
import CurrentUserCam from '@/components/page/call/camera/CurrentUserCam';
import CallProvider from '@/components/providers/CallProvider';
import LocalMediaProvider from '@/components/providers/LocalMediaProvider';

export default async function CallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <LocalMediaProvider>
      <CallProvider conversationId={id}>
        <div className="h-dvh w-dvw bg-slate-950 relative">
          <RemoteParticipants />
          <CurrentUserCam />
          <Controls />
        </div>
      </CallProvider>
    </LocalMediaProvider>
  );
}
