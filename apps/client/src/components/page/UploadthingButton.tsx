import { OurFileRouter } from '@/app/api/uploadthing/core';
import { generateUploadButton, generateUploadDropzone } from '@uploadthing/react';

export const UploadThingButton = generateUploadButton<OurFileRouter>();
export const UploadThingDropzone = generateUploadDropzone<OurFileRouter>();
