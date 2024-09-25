import { OurFileRouter } from "@/app/api/uploadthing/core";
import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";

export const UploadthingButton = generateUploadButton<OurFileRouter>();
export const UploadthingDropzone = generateUploadDropzone<OurFileRouter>();
