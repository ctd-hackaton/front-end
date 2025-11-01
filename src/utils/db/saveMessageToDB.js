import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";

export async function saveMessageToDB(userId, message) {
  const userDocRef = doc(db, "users", userId);
  await updateDoc(userDocRef, {
    messageHistory: arrayUnion({
      ...message,
      createdAt: Date.now(),
    }),
  });
}
