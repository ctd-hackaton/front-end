import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";

// Helper to remove undefined fields from an object
function sanitize(obj) {
  // JSON stringify/parse removes undefined properties
  return JSON.parse(JSON.stringify(obj));
}

export async function saveMessageToDB(userId, message) {
  const userDocRef = doc(db, "users", userId);
  const sanitized = sanitize(message || {});
  const payload = { ...sanitized, createdAt: Date.now() };

  await updateDoc(userDocRef, {
    messageHistory: arrayUnion(payload),
  });
}
