import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function saveMealPlan(userId, mealPlan) {
  const mealPlanRef = doc(db, "users", userId, "mealPlans", mealPlan.id);
  await setDoc(mealPlanRef, {
    ...mealPlan,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}
