import { NextRequest, NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";

// Initialize UploadThing API
const utapi = new UTApi();

export async function DELETE(req: NextRequest) {
  try {
    const { sketchId, userId, imageUrl } = await req.json();

    if (!sketchId || !userId || !imageUrl) {
      return NextResponse.json(
        { error: "Missing required fields: sketchId, userId, or imageUrl" },
        { status: 400 }
      );
    }

    // Extract the file key from the UploadThing URL
    // URL format: https://utfs.io/f/{fileKey}
    const fileKey = imageUrl.split("/f/")[1];
    
    if (!fileKey) {
      return NextResponse.json(
        { error: "Invalid UploadThing URL format" },
        { status: 400 }
      );
    }

    try {
      await utapi.deleteFiles(fileKey);
      console.log("✅ Deleted from UploadThing:", fileKey);
    } catch (uploadError) {
      console.error("⚠️ Failed to delete from UploadThing:", uploadError);
      // Continue with Firestore deletion even if UploadThing fails
    }

    // Step 2: Delete from Firestore
    const sketchRef = doc(db, "sketches", userId, "items", sketchId);
    await deleteDoc(sketchRef);
    console.log("Deleted from Firestore:", sketchId);

    return NextResponse.json(
      { 
        success: true, 
        message: "Sketch deleted successfully",
        deletedFileKey: fileKey 
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error("Error deleting sketch:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to delete sketch" 
      },
      { status: 500 }
    );
  }
}
