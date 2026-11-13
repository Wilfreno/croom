import OpenCamera from './OpenCamera';
import SelectCamera from './SelectCamera';

export default function CameraControl() {
  return (
    <div className="flex items-center  h-fit bg-muted-foreground rounded-full">
      <SelectCamera />
      <OpenCamera />
    </div>
  );
}
