import ChatButton from '@/components/page/call/ChatButton';
import ChatPanel from '@/components/page/call/ChatPanel';
import Controls from '@/components/page/call/Controls';
import ParticipantsButton from '@/components/page/call/ParticipantsButton';
import ParticipantsPanel from '@/components/page/call/ParticipantsPanel';
import RemoteParticipants from '@/components/page/call/RemoteParticipants';
import CurrentUserCam from '@/components/page/call/camera/CurrentUserCam';
import CallProvider from '@/components/providers/CallProvider';
import CallSidePanelProvider from '@/components/providers/CallSidePanelProvider';
import LocalMediaProvider from '@/components/providers/LocalMediaProvider';
import PinnedParticipantsProvider from '@/components/providers/PinnedParticipantsProvider';

export default async function CallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <LocalMediaProvider>
      <CallProvider conversationId={id}>
        <CallSidePanelProvider>
          <PinnedParticipantsProvider>
            <div className="relative flex h-dvh w-dvw bg-slate-950">
              <section aria-label="Call" className="relative min-w-0 grow">
                <RemoteParticipants />
                <CurrentUserCam />
                <Controls />
                <div className="absolute bottom-24 right-4 flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 p-2 shadow-lg backdrop-blur-md sm:bottom-10">
                  <ChatButton />
                  <ParticipantsButton />
                </div>
              </section>
              <ParticipantsPanel />
              <ChatPanel />
            </div>
          </PinnedParticipantsProvider>
        </CallSidePanelProvider>
      </CallProvider>
    </LocalMediaProvider>
  );
}
