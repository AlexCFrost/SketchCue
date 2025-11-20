import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";

export interface SaveSketchResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export async function saveSketch(
  imageUrl: string, 
  description: string
): Promise<SaveSketchResult> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "User not logged in" };
    }

    // Rate limiting: max 3 sketches per 30 minutes
    const cutoff = new Date(Date.now() - 30 * 60 * 1000);
    const q = query(
      collection(db, "sketches", user.uid, "items"),
      where("timestamp", ">", cutoff)
    );
    const docs = await getDocs(q);
    
    if (docs.size >= 3) {
      return { 
        success: false, 
        error: "Rate limit exceeded. You can save up to 3 sketches per 30 minutes." 
      };
    }

    // Save sketch metadata to Firestore (image is already uploaded to UploadThing)
    await addDoc(collection(db, "sketches", user.uid, "items"), {
      imageUrl,
      description,
      timestamp: serverTimestamp(),
    });

    return { success: true, imageUrl };
  } catch (error) {
    console.error("Error saving sketch:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to save sketch" 
    };
  }
}
