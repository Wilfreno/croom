import Controls from '@/components/page/call/Controls';
import ParticipantsButton from '@/components/page/call/ParticipantsButton';
import ParticipantsPanel from '@/components/page/call/ParticipantsPanel';
import RemoteParticipants from '@/components/page/call/RemoteParticipants';
import CurrentUserCam from '@/components/page/call/camera/CurrentUserCam';
import CallProvider from '@/components/providers/CallProvider';
import LocalMediaProvider from '@/components/providers/LocalMediaProvider';
import ParticipantsPanelProvider from '@/components/providers/ParticipantsPanelProvider';
import PinnedParticipantsProvider from '@/components/providers/PinnedParticipantsProvider';

export default async function CallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <LocalMediaProvider>
      <CallProvider conversationId={id}>
        <ParticipantsPanelProvider>
          <PinnedParticipantsProvider>
            <div className="relative flex h-dvh w-dvw bg-slate-950">
              <section aria-label="Call" className="relative min-w-0 grow">
                <RemoteParticipants />
                <CurrentUserCam />
                <Controls />
                <ParticipantsButton />
              </section>
              <ParticipantsPanel />
            </div>
          </PinnedParticipantsProvider>
        </ParticipantsPanelProvider>
      </CallProvider>
    </LocalMediaProvider>
  );
}
