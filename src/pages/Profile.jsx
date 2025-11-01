import { useState, useEffect } from "react";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "../utils/firebase";
import { useAuth } from "../hooks/useAuth";
import styles from "../css/Profile.module.css";

export default function Profile() {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    age: "",
    weightKg: "",
    heightCm: "",
    activityLevel: "light",
    dietType: "none",
    favoriteCuisine: [],
    excludedIngredients: "",
    allergies: [],
    dailyCalorieTarget: "",
    proteinGoalGrams: "",
    carbsGoalGrams: "",
    fatsGoalGrams: "",
    maxIngredients: "",
    maxTime: "",
  });

  // Подгружаем существующие данные
  useEffect(() => {
    if (!currentUser) return;
    const fetchData = async () => {
      const userRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          age: data.personalData?.age || "",
          weightKg: data.personalData?.weightKg || "",
          heightCm: data.personalData?.heightCm || "",
          activityLevel: data.personalData?.activityLevel || "light",
          dietType: data.preferences?.dietType || "none",
          favoriteCuisine: data.preferences?.favoriteCuisine || [],
          excludedIngredients: (data.preferences?.excludedIngredientRefs || []).join(", "),
          allergies: data.preferences?.allergyIngredientRefs || [],
          dailyCalorieTarget: data.goals?.dailyCalorieTarget || "",
          proteinGoalGrams: data.goals?.proteinGoalGrams || "",
          carbsGoalGrams: data.goals?.carbsGoalGrams || "",
          fatsGoalGrams: data.goals?.fatsGoalGrams || "",
        });
      }
    };
    fetchData();
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (cuisine) => {
    setFormData((prev) => {
      const current = prev.favoriteCuisine;
      return current.includes(cuisine)
        ? { ...prev, favoriteCuisine: current.filter((c) => c !== cuisine) }
        : { ...prev, favoriteCuisine: [...current, cuisine] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert("Please log in first");

    const userRef = doc(db, "users", currentUser.uid);
    const payload = {
      email: currentUser.email,
      displayName: currentUser.displayName || "User",
      createdAt: Timestamp.now(),
      personalData: {
        age: Number(formData.age),
        weightKg: Number(formData.weightKg),
        heightCm: Number(formData.heightCm),
        activityLevel: formData.activityLevel,
      },
      preferences: {
        dietType: formData.dietType,
        favoriteCuisine: formData.favoriteCuisine,
        excludedIngredientRefs: formData.excludedIngredients
          ? formData.excludedIngredients.split(",").map((i) => i.trim())
          : [],
        allergyIngredientRefs: formData.allergies,
        maxIngredients: formData.maxIngredients ? Number(formData.maxIngredients) : null,
        maxTime: formData.maxTime ? Number(formData.maxTime) : null,
      },
      goals: {
        dailyCalorieTarget: Number(formData.dailyCalorieTarget),
        proteinGoalGrams: Number(formData.proteinGoalGrams),
        carbsGoalGrams: Number(formData.carbsGoalGrams),
        fatsGoalGrams: Number(formData.fatsGoalGrams),
      },
    };

    try {
      await setDoc(userRef, payload, { merge: true });
      alert("Data saved successfully!");
    } catch (err) {
      console.error("Error saving user data:", err);
      alert("ailed to save data");
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>User Questionnaire</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <section className={styles.section}>
          <h3>Personal Data</h3>
          <label>
            Age:
            <input type="number" name="age" value={formData.age} onChange={handleChange} />
          </label>
          <label>
            Weight (kg):
            <input type="number" name="weightKg" value={formData.weightKg} onChange={handleChange} />
          </label>
          <label>
            Height (cm):
            <input type="number" name="heightCm" value={formData.heightCm} onChange={handleChange} />
          </label>
          <label>
            Activity level:
            <select name="activityLevel" value={formData.activityLevel} onChange={handleChange}>
              <option value="sedentary">Sedentary</option>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="active">Active</option>
            </select>
          </label>
        </section>

        <section className={styles.section}>
          <h3>Preferences</h3>
          <label>
            Diet type:
            <select name="dietType" value={formData.dietType} onChange={handleChange}>
              <option value="none">None</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="paleo">Paleo</option>
              <option value="keto">Keto</option>
              <option value="high-fiber">High-fiber</option>
              <option value="high-protein">High-protein</option>
              <option value="low-carb">Low-carb</option>
              <option value="low-fat">Low-fat</option>
              <option value="low-sodium">Low-sodium</option>
              <option value="low-sugar">Low-sugar</option>
              <option value="alcohol-free">Alcohol-free</option>
              <option value="balanced">Balanced</option>
              <option value="immunity">Immunity</option>
            </select>
          </label>

          {/* <p>Favorite cuisine:</p>
          {["italian", "mexican", "japanese", "indian"].map((cuisine) => (
            <label key={cuisine} className={styles.checkbox}>
              <input
                type="checkbox"
                checked={formData.favoriteCuisine.includes(cuisine)}
                onChange={() => handleCheckbox(cuisine)}
              />
              {cuisine}
            </label>
          ))} */}

          <label>
            Excluded ingredients (comma-separated):
            <input
              type="text"
              name="excludedIngredients"
              value={formData.excludedIngredients}
              onChange={handleChange}
              placeholder="e.g. beetroot, onion"
            />
          </label>

          <p>Allergies:</p>
          {["Gluten", "Peanuts", "Tree Nuts", "Dairy", "Eggs", "Shellfish", "Wheat", "Soy", "Fish"].map(
            (allergy) => (
              <label key={allergy} className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.allergies.includes(allergy)}
                  onChange={() =>
                    setFormData((prev) => {
                      const current = prev.allergies;
                      return current.includes(allergy)
                        ? { ...prev, allergies: current.filter((a) => a !== allergy) }
                        : { ...prev, allergies: [...current, allergy] };
                    })
                  }
                />
                {allergy}
              </label>
            )
          )}
          <label>
            Maximum number of ingredients per recipe:
            <input
              type="number"
              name="maxIngredients"
              min={1}
              max={20}
              value={formData.maxIngredients || ""}
              onChange={handleChange}
              placeholder="e.g. 5"
            />
          </label>
          <label>
            Maximum number of time per recipe(minutes):
            <input
              type="number"
              name="maxTime"
              min={1}
              max={99}
              value={formData.maxTime || ""}
              onChange={handleChange}
              placeholder="e.g. 30 minutes"
            />
          </label>
        </section>

        <section className={styles.section}>
          <h3>Goals</h3>
          <label>
            Daily Calories:
            <input
              type="number"
              name="dailyCalorieTarget"
              value={formData.dailyCalorieTarget}
              onChange={handleChange}
            />
          </label>
          <label>
            Protein (g):
            <input
              type="number"
              name="proteinGoalGrams"
              value={formData.proteinGoalGrams}
              onChange={handleChange}
            />
          </label>
          <label>
            Carbs (g):
            <input
              type="number"
              name="carbsGoalGrams"
              value={formData.carbsGoalGrams}
              onChange={handleChange}
            />
          </label>
          <label>
            Fats (g):
            <input
              type="number"
              name="fatsGoalGrams"
              value={formData.fatsGoalGrams}
              onChange={handleChange}
            />
          </label>
        </section>

        <button type="submit" className={styles.submitBtn}>
          Save
        </button>
      </form>
    </div>
  );
}
