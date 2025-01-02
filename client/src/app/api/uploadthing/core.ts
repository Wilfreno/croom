import { createUploadthing, type FileRouter } from "uploadthing/next";
const f = createUploadthing();

export const ourFileRouter = {
  multiple_image: f({ image: { minFileCount: 1, maxFileCount: 30, maxFileSize: "4MB" } }).onUploadComplete(async ({ file }) => {
    return { photo_url: file.url };
  }),
  single_image: f({ image: { minFileCount: 1, maxFileCount: 1, maxFileSize: "4MB" } }).onUploadComplete(
    async ({ file }) => {
      return { photo_url: file.url };
    }
  ),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
