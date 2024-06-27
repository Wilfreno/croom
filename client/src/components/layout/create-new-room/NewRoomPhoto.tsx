"use client";

import { Button } from "@/components/ui/button";
import { CldUploadWidget, CloudinaryUploadWidgetInfo } from "next-cloudinary";
import { ArrowPathIcon, CameraIcon, PlusIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@/lib/redux/store";
import { setNewRoom } from "@/lib/redux/slices/new-room-slice";

export default function NewRoomPhoto() {
  const dispatch = useDispatch<AppDispatch>();
  const new_room = useAppSelector((state) => state.new_room_reducer);
  const upload_preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const [photo_info, setRoomPhoto] = useState<CloudinaryUploadWidgetInfo>();
  if (!upload_preset)
    throw new Error(
      "cannot find NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your .env.local file"
    );

  useEffect(() => {
    dispatch(
      setNewRoom({
        ...new_room,
        photo: {
          url: photo_info?.secure_url || "",
          height: photo_info?.height || 0,
          width: photo_info?.width || 0,
        },
      })
    );
  }, [photo_info]);

  return (
    <section>
      <CldUploadWidget
        uploadPreset={upload_preset}
        options={{
          folder: "/croom/room-photo",
          maxFiles: 1,
          cropping: true,
        }}
        onSuccess={(result) =>
          setRoomPhoto(result.info as CloudinaryUploadWidgetInfo)
        }
        onError={(error) => console.log("error::", error)}
      >
        {({ open }) => {
          return (
            <Button
              type="button"
              variant="ghost"
              onClick={() => open()}
              className="relative aspect-square w-[10vw] h-auto p-0 border-2 border-primary rounded-full flex items-center justify-center mx-auto"
            >
              {photo_info ? (
                <>
                  <Image
                    src={photo_info.secure_url}
                    alt={photo_info.original_filename.slice(0, 1).toUpperCase()}
                    width={photo_info.width}
                    height={photo_info.height}
                    className="h-full w-full rounded-full object-cover"
                  />
                  <ArrowPathIcon className="h-6 p-1 absolute bottom-4 right-0 stroke-2 bg-primary rounded-full" />
                </>
              ) : (
                <>
                  <CameraIcon className="h-10 fill-primary" />
                  <PlusIcon className="h-6 p-1 absolute top-4 right-0 bg-primary rounded-full" />
                </>
              )}
            </Button>
          );
        }}
      </CldUploadWidget>
      {photo_info && (
        <Button
          type="button"
          variant="link"
          className="text-sm text-primary font-bold"
          onClick={() => setRoomPhoto(undefined)}
        >
          Delete photo
        </Button>
      )}
    </section>
  );
}
