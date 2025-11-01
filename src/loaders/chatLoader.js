import { auth } from "../utils/firebase";
import { loadMessageHistory } from "../utils/db";

export async function chatLoader() {
  // Wait for auth to be ready
  const user = await new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });

  if (!user) {
    return { messages: [] };
  }

  try {
    const messages = await loadMessageHistory(user.uid);
    return { messages };
  } catch (error) {
    console.error("Failed to load message history:", error);
    return { messages: [] };
  }
}
