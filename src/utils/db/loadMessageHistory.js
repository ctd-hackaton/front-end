import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function loadMessageHistory(userId) {
  const userDocRef = doc(db, "users", userId);
  const docSnap = await getDoc(userDocRef);

  if (docSnap.exists()) {
    return docSnap.data().messageHistory || [];
  }

  return [];
}
