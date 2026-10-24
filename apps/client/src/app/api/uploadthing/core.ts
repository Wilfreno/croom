import { createUploadthing, type FileRouter } from "uploadthing/next";
const f = createUploadthing();

export const ourFileRouter = {
  multipleImage: f({ image: { minFileCount: 1, maxFileCount: 30, maxFileSize: "4MB" } }).onUploadComplete(async ({ file }) => {
    return { photoUrl: file.url };
  }),
  singleImage: f({ image: { minFileCount: 1, maxFileCount: 1, maxFileSize: "4MB" } }).onUploadComplete(
    async ({ file }) => {
      return { photoUrl: file.url };
    }
  ),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
