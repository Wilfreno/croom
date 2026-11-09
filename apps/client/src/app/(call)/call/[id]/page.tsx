import Controls from '@/components/page/call/Controls';
import CurrentUserCam from '@/components/page/call/camera/CurrentUserCam';
import LocalMediaProvider from '@/components/providers/LocalMediaProvider';

export default function CallPage() {
  return (
    <LocalMediaProvider>
      <div className="h-dvh w-dvw bg-slate-950 relative">
        <CurrentUserCam />
        <Controls />
      </div>
    </LocalMediaProvider>
  );
}
