import { Button } from "@/components/ui/button";

import { CameraIcon, PlusIcon } from "@heroicons/react/24/solid";

export default function NewRoomPhoto() {
  return (
    <Button
      type="button"
      variant="ghost"
      className="relative aspect-square w-[10vw] h-auto border-2 border-primary rounded-full flex items-center justify-center mx-auto"
    >
      <div className="flex flex-col items-center justify-center">
        <CameraIcon className="h-10 fill-primary" />
        <p className="font-bold">upload</p>
      </div>
      <Button
        type="button"
        className="aspect-square h-fit w-auto p-1 rounded-full absolute top-1 right-1 "
      >
        <PlusIcon className="h-5 stroke-2" />
      </Button>
    </Button>
  );
}
