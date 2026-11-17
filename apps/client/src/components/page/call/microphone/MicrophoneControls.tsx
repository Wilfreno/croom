import SelectMicrophone from './SelectMicrophone';
import ToggleMicrophone from './ToggleMicrophone';

export default function MicrophoneControl() {
  return (
    <div className="flex items-center h-fit bg-muted-foreground rounded-full">
      <SelectMicrophone />
      <ToggleMicrophone />
    </div>
  );
}
