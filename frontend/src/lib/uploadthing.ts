import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

// Generate type-safe React helpers
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();
