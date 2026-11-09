import { Button } from '@/components/ui/button';
import { Mic, Phone } from 'lucide-react';
import CameraControl from './camera/CameraControls';

export default function Controls() {
  return (
    <section className="bg-white/20 backdrop-blur-sm absolute bottom-10 right-1/2 translate-x-1/2 border border-muted rounded-full flex items-center  gap-20 p-2">
      <div className="flex items-center gap-10">
        <Button variant="outline" className="rounded-full">
          <Mic />
        </Button>
        <CameraControl />
      </div>
      <Button variant="destructive" className="rounded-full">
        <Phone />
      </Button>
    </section>
  );
}
