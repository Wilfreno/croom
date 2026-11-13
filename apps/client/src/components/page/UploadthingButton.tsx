import { OurFileRouter } from '@/app/api/uploadthing/core';
import { withBasePath } from '@/lib/utils';
import { generateUploadButton, generateUploadDropzone } from '@uploadthing/react';

const url = withBasePath('/api/uploadthing');

export const UploadThingButton = generateUploadButton<OurFileRouter>({ url });
export const UploadThingDropzone = generateUploadDropzone<OurFileRouter>({ url });
