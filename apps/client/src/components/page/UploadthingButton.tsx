import { fetchWithServerCookies } from '@/lib/utils';
import { UPLOAD_ROUTE } from '@repo/constants';
import { generateUploadButton } from '@uploadthing/react';
import type { FileRouter } from 'uploadthing/types';

export const UploadThingButton = generateUploadButton<FileRouter>({
  url: `${process.env.NEXT_PUBLIC_SERVER_V1}/${UPLOAD_ROUTE}`,
  fetch: fetchWithServerCookies,
});
