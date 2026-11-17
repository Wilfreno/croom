import OpenCamera from './OpenCamera';
import SelectCamera from './SelectCamera';

export default function CameraControl() {
  return (
    <div className="flex items-center rounded-full bg-white/10">
      <SelectCamera />
      <OpenCamera />
    </div>
  );
}
