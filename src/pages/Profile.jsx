import { useState, useEffect } from "react";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "../utils/firebase";
import { useAuth } from "../hooks/useAuth";
import styles from "../css/Profile.module.css";
import { useNavigate } from "react-router-dom";

//convertation
const lbToKg = (lb) => lb * 0.45359237;
const kgToLb = (kg) => kg / 0.45359237;
const cmToFeetInches = (cm) => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
};
const feetInchesToCm = (feet, inches) => (feet * 12 + inches) * 2.54;

export default function Profile() {
  const navigate = useNavigate(); 
  const { currentUser } = useAuth();

  const [units, setUnits] = useState({
    weight: "lb", 
    height: "ft", 
  });

  const [formData, setFormData] = useState({
    age: "",
    weightKg: "",
    heightCm: "",
    weightDisplay: "",
    heightFeet: "",
    heightInches: "",
    activityLevel: "light",
    dietType: "none",
    favoriteCuisine: [],
    excludedIngredients: "",
    allergies: [],
    dailyCalorieTarget: "",
    proteinGoalGrams: "",
    carbsGoalGrams: "",
    fatsGoalGrams: "",
  });

  // Подгружаем существующие данные
  useEffect(() => {
    if (!currentUser) return;
    const fetchData = async () => {
      const userRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const weightKg = data.personalData?.weightKg || "";
        const heightCm = data.personalData?.heightCm || "";

        let weightDisplay = "";
        let heightFeet = "";
        let heightInches = "";

        if (weightKg !== "") {
          weightDisplay = kgToLb(Number(weightKg)).toFixed(1);
        }
        if (heightCm !== "") {
          const { feet, inches } = cmToFeetInches(Number(heightCm));
          heightFeet = feet;
          heightInches = inches;
        }
        setFormData({
          age: data.personalData?.age || "",
          weightKg,
          heightCm,
          weightDisplay,
          heightFeet,
          heightInches,
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

  const handleUnitChange = (type, value) => {
    setUnits((prev) => ({ ...prev, [type]: value }));

    if (type === "weight") {
      if (value === "kg") {
        setFormData((prev) => ({
          ...prev,
          weightDisplay: prev.weightKg,
        }));
      } else {
        const lb = prev.weightKg ? kgToLb(Number(prev.weightKg)).toFixed(1) : "";
        setFormData((prev) => ({
          ...prev,
          weightDisplay: lb,
        }));
      }
    }

    if (type === "height") {
      if (value === "cm") {
        setFormData((prev) => ({
          ...prev,
          heightFeet: "",
          heightInches: "",
        }));
      } else {
        if (prev.heightCm) {
          const { feet, inches } = cmToFeetInches(Number(prev.heightCm));
          setFormData((prev) => ({
            ...prev,
            heightFeet: feet,
            heightInches: inches,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            heightFeet: "",
            heightInches: "",
          }));
        }
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "weightDisplay") {
      const numValue = value === "" ? "" : Number(value);
      if (units.weight === "kg") {
        setFormData((prev) => ({
          ...prev,
          weightKg: numValue,
        }));
      } else {
        // lb → kg
        const kg = value === "" ? "" : lbToKg(numValue);
        setFormData((prev) => ({
          ...prev,
          weightKg: kg,
        }));
      }
    }

    if (name === "heightFeet" || name === "heightInches") {
      const feet = name === "heightFeet" ? (value === "" ? 0 : Number(value)) : Number(prev.heightFeet || 0);
      const inches = name === "heightInches" ? (value === "" ? 0 : Number(value)) : Number(prev.heightInches || 0);
      const cm = feetInchesToCm(feet, inches);
      setFormData((prev) => ({
        ...prev,
        heightCm: cm > 0 ? cm : "",
      }));
    }

    if (name === "heightCm") {
      const numValue = value === "" ? "" : Number(value);
      setFormData((prev) => ({
        ...prev,
        heightCm: numValue,
      }));
    }
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
    if (formData.weightKg < 0 || formData.heightCm < 0 || formData.age < 0) {
      alert("Please enter valid non-negative numbers.");
      return;
    }
    const userRef = doc(db, "users", currentUser.uid);
    const payload = {
      email: currentUser.email,
      displayName: currentUser.displayName || "User",
      createdAt: Timestamp.now(),
      personalData: {
        age: formData.age ? Number(formData.age) : null,
        weightKg: formData.weightKg ? Number(formData.weightKg) : null,
        heightCm: formData.heightCm ? Number(formData.heightCm) : null,
        activityLevel: formData.activityLevel,
      },
      preferences: {
        dietType: formData.dietType,
        favoriteCuisine: formData.favoriteCuisine,
        excludedIngredientRefs: formData.excludedIngredients
          ? formData.excludedIngredients.split(",").map((i) => i.trim())
          : [],
        allergyIngredientRefs: formData.allergies,
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
      navigate("/chat");
    } catch (err) {
      console.error("Error saving user data:", err);
      alert("Failed to save data");
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
          <div className={styles.unitGroup}>
            <span>Weight:</span>
            <div className={styles.unitToggle}>
              <button
                type="button"
                className={units.weight === "lb" ? styles.activeUnit : ""}
                onClick={() => handleUnitChange("weight", "lb")}
              >
                lb
              </button>
              <button
                type="button"
                className={units.weight === "kg" ? styles.activeUnit : ""}
                onClick={() => handleUnitChange("weight", "kg")}
              >
                kg
              </button>
            </div>
            <input
              type="number"
              name="weightDisplay"
              min="0"
              step={units.weight === "lb" ? "0.1" : "0.01"}
              value={formData.weightDisplay}
              onChange={handleChange}
              placeholder={`Enter weight in ${units.weight}`}
            />
          </div>
          <div className={styles.unitGroup}>
            <span>Height:</span>
            <div className={styles.unitToggle}>
              <button
                type="button"
                className={units.height === "ft" ? styles.activeUnit : ""}
                onClick={() => handleUnitChange("height", "ft")}
              >
                ft/in
              </button>
              <button
                type="button"
                className={units.height === "cm" ? styles.activeUnit : ""}
                onClick={() => handleUnitChange("height", "cm")}
              >
                cm
              </button>
            </div>
            {units.height === "ft" ? (
              <div className={styles.heightInputs}>
                <input
                  type="number"
                  name="heightFeet"
                  min="0"
                  max="9"
                  value={formData.heightFeet}
                  onChange={handleChange}
                  placeholder="ft"
                />
                <input
                  type="number"
                  name="heightInches"
                  min="0"
                  max="11"
                  value={formData.heightInches}
                  onChange={handleChange}
                  placeholder="in"
                />
              </div>
            ) : (
              <input
                type="number"
                name="heightCm"
                min="0"
                value={formData.heightCm}
                onChange={handleChange}
                placeholder="Enter height in cm"
              />
            )}
          </div>

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
