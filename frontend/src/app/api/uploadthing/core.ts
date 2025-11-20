import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// FileRouter for handling sketch image uploads
export const ourFileRouter = {
  // Sketch image uploader 
  sketchUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      // Auth is already handled on the client side
      // Return empty metadata
      return { 
        uploadedAt: new Date().toISOString()
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("  Sketch upload complete");
      console.log("  Uploaded at:", metadata.uploadedAt);
      console.log("  File URL:", file.url);
      console.log("  File key:", file.key);

      return { 
        url: file.url,
        key: file.key
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
