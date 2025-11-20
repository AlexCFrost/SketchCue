import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp, firestore, storage as _storage } from "firebase-admin";
initializeApp();

export const deleteOldSketches = onSchedule("every 30 minutes", async () => {
  const db = firestore();
  const storage = _storage().bucket();
  const cutoff = Date.now() - 30 * 60 * 1000;

  const users = await db.collection("sketches").listDocuments();
  for (const user of users) {
    const items = await user.collection("items").get();
    for (const doc of items.docs) {
      const data = doc.data();
      if (data.createdAt?.toMillis() < cutoff) {
        const filePath = decodeURIComponent(data.imageUrl.split("/o/")[1].split("?")[0]);
        await storage.file(filePath).delete().catch(() => {});
        await doc.ref.delete();
      }
    }
  }
});
