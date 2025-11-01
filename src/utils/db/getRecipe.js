import { db } from "../firebase";

export async function getRecipe(recipe) {
  try {
    const docRef = db.collection("recipes").doc(recipe);
    const snap = await docRef.get();
    if (!snap.exists) return null;
    return snap.data();
  } catch (err) {
    console.error("getRecipe error", err);
    return null;
  }
}
