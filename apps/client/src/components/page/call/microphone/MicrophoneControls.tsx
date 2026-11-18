import SelectMicrophone from './SelectMicrophone';
import ToggleMicrophone from './ToggleMicrophone';

export default function MicrophoneControl() {
  return (
    <div className="flex items-center rounded-full bg-white/10">
      <SelectMicrophone />
      <ToggleMicrophone />
    </div>
  );
}
