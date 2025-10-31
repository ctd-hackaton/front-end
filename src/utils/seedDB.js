import { doc, setDoc, writeBatch, Timestamp } from "firebase/firestore";

// --- 1. MOCK DATA (ENGLISH) ---

// Ingredient IDs for easy reference
const ING_IDS = {
  BEEF_MINCE: 'ing_001',
  BEETROOT: 'ing_002',
  NAAN_BREAD: 'ing_003',
  ROCKET: 'ing_004',
  SOUR_CREAM: 'ing_005',
  LAMB_MINCE: 'ing_006',
  CUCUMBER: 'ing_007',
  GREEK_YOGURT: 'ing_008',
  MINT: 'ing_009',
  CHICKEN_BREAST: 'ing_010',
  HALLOUMI: 'ing_011',
  HOT_SAUCE: 'ing_012',
  BURGER_BUN: 'ing_013',
  LETTUCE: 'ing_014',
  ONION: 'ing_015',
  AVOCADO: 'ing_016',
  EGG: 'ing_017',
  TOMATO: 'ing_018',
};

// --- Collection: /ingredients ---
// (Based on your Burger.txt file)
const ingredientsData = [
  { id: ING_IDS.BEEF_MINCE, nameEn: 'Beef Mince', category: 'meat', approxCaloriesPer100g: 250, defaultUnit: 'g' },
  { id: ING_IDS.BEETROOT, nameEn: 'Beetroot (Cooked)', category: 'vegetable', approxCaloriesPer100g: 44, defaultUnit: 'g' },
  { id: ING_IDS.NAAN_BREAD, nameEn: 'Naan Bread', category: 'carbs', approxCaloriesPer100g: 300, defaultUnit: 'pcs' },
  { id: ING_IDS.ROCKET, nameEn: 'Rocket', category: 'vegetable', approxCaloriesPer100g: 25, defaultUnit: 'g' },
  { id: ING_IDS.SOUR_CREAM, nameEn: 'Sour Cream', category: 'dairy', approxCaloriesPer100g: 193, defaultUnit: 'g' },
  { id: ING_IDS.LAMB_MINCE, nameEn: 'Lamb Mince', category: 'meat', approxCaloriesPer100g: 282, defaultUnit: 'g' },
  { id: ING_IDS.CUCUMBER, nameEn: 'Cucumber', category: 'vegetable', approxCaloriesPer100g: 15, defaultUnit: 'g' },
  { id: ING_IDS.GREEK_YOGURT, nameEn: 'Greek Yogurt', category: 'dairy', approxCaloriesPer100g: 59, defaultUnit: 'g' },
  { id: ING_IDS.MINT, nameEn: 'Mint', category: 'vegetable', approxCaloriesPer100g: 70, defaultUnit: 'g' },
  { id: ING_IDS.CHICKEN_BREAST, nameEn: 'Chicken Breast', category: 'meat', approxCaloriesPer100g: 165, defaultUnit: 'g' },
  { id: ING_IDS.HALLOUMI, nameEn: 'Halloumi Cheese', category: 'dairy', approxCaloriesPer100g: 321, defaultUnit: 'g' },
  { id: ING_IDS.HOT_SAUCE, nameEn: 'Hot Sauce', category: 'condiment', approxCaloriesPer100g: 29, defaultUnit: 'ml' },
  { id: ING_IDS.BURGER_BUN, nameEn: 'Burger Bun', category: 'carbs', approxCaloriesPer100g: 280, defaultUnit: 'pcs' },
  { id: ING_IDS.LETTUCE, nameEn: 'Lettuce', category: 'vegetable', approxCaloriesPer100g: 15, defaultUnit: 'g' },
  // Extra ingredients for pantry
  { id: ING_IDS.ONION, nameEn: 'Onion', category: 'vegetable', approxCaloriesPer100g: 40, defaultUnit: 'g' },
  { id: ING_IDS.AVOCADO, nameEn: 'Avocado', category: 'fruit', approxCaloriesPer100g: 160, defaultUnit: 'pcs' },
  { id: ING_IDS.EGG, nameEn: 'Egg', category: 'dairy', approxCaloriesPer100g: 155, defaultUnit: 'pcs' },
  { id: ING_IDS.TOMATO, nameEn: 'Tomato', category: 'vegetable', approxCaloriesPer100g: 18, defaultUnit: 'g' },
];

// --- Mock User ID ---
// !! IMPORTANT: Replace this with a real User UID from your Firebase Authentication tab
const MOCK_USER_ID = "iIiIEVlKGoUOYdn2x7SyLSXj1ew1";

// --- Collection: /users/{MOCK_USER_ID} ---
const mockUser1Data = {
  email: "test.user@example.com",
  displayName: "Test User",
  createdAt: Timestamp.now(),
  personalData: {
    age: 28,
    weightKg: 70,
    heightCm: 175,
    activityLevel: 'light' // 'sedentary', 'light', 'moderate', 'active'
  },
  preferences: {
    dietType: 'none', // 'vegetarian', 'vegan', 'keto', 'none'
    favoriteCuisine: ['italian', 'mexican'], // 'italian' from your Italian.txt
    excludedIngredientRefs: [ING_IDS.BEETROOT], // User doesn't like beetroot
    allergyIngredientRefs: []
  },
  goals: {
    dailyCalorieTarget: 2000,
    proteinGoalGrams: 120,
    carbsGoalGrams: 200,
    fatsGoalGrams: 80
  }
};

// --- Subcollection: /users/{MOCK_USER_ID}/pantry ---
// (What the user has in their fridge)
const mockUser1Pantry = [
  // Document ID is the Ingredient ID for easy checking
  { id: ING_IDS.CHICKEN_BREAST, quantity: 400, unit: 'g', addedAt: Timestamp.now() },
  { id: ING_IDS.EGG, quantity: 6, unit: 'pcs', addedAt: Timestamp.now() },
  { id: ING_IDS.AVOCADO, quantity: 1, unit: 'pcs', addedAt: Timestamp.now() },
  { id: ING_IDS.ONION, quantity: 200, unit: 'g', addedAt: Timestamp.now() },
  { id: ING_IDS.LETTUCE, quantity: 50, unit: 'g', addedAt: Timestamp.now() },
];

// --- Subcollection: /users/{MOCK_USER_ID}/mealPlans ---
// (Based on Burger.txt)
const mockUser1MealPlans = [
  { 
    id: 'plan_burger_001',
    date: Timestamp.fromDate(new Date('2025-10-31T00:00:00')), // Tomorrow's date
    mealType: 'dinner',
    recipeApiID: '53099', // Aussie Burgers from Burger.txt
    recipeTitle: 'Aussie Burgers',
    recipeImageURL: 'https://www.themealdb.com/images/media/meals/44bzep1761848278.jpg',
    calories: 850, // Estimated
    macros: { protein: 45, fats: 40, carbs: 60 }, // Estimated
    consumed: false
  }
];

// --- Subcollection: /users/{MOCK_USER_ID}/savedRecipes ---
// (Based on Italian.txt)
const mockUser1SavedRecipes = [
  // Document ID is the recipeApiID for easy checking
  { 
    id: '52844', // Lasagne
    title: 'Lasagne',
    imageUrl: 'https://www.themealdb.com/images/media/meals/wtsvxx1511296896.jpg',
    savedAt: Timestamp.now()
  },
  { 
    id: '52982', // Spaghetti alla Carbonara
    title: 'Spaghetti alla Carbonara',
    imageUrl: 'https://www.themealdb.com/images/media/meals/llcbn01574260722.jpg',
    savedAt: Timestamp.now()
  }
];

// --- Subcollection: /users/{MOCK_USER_ID}/shoppingLists ---
const mockUser1ShoppingList = {
  id: 'list_for_burgers',
  dateCreated: Timestamp.now(),
  items: [
    // Items needed for the "Aussie Burgers" meal plan
    { ingredientRef: ING_IDS.BEEF_MINCE, quantityNeeded: 500, unit: 'g', purchased: false },
    { ingredientRef: ING_IDS.NAAN_BREAD, quantityNeeded: 2, unit: 'pcs', purchased: false },
    { ingredientRef: ING_IDS.ROCKET, quantityNeeded: 50, unit: 'g', purchased: true }, // Already bought
    { ingredientRef: ING_IDS.SOUR_CREAM, quantityNeeded: 100, unit: 'g', purchased: false },
  ]
};

// --- 2. SEED FUNCTION ---

/**
 * Uploads all mock data to Firestore.
 * @param {Firestore} db - The Firestore instance from firebaseConfig.js
 */
export async function seedDatabase(db) {
  if (MOCK_USER_ID === "PASTE_YOUR_MOCK_USER_UID_HERE") {
    console.error("!!! ERROR: Please update MOCK_USER_ID in src/utils/seedDatabase.js!");
    alert("ERROR: Please update MOCK_USER_ID in src/utils/seedDatabase.js!");
    return;
  }

  console.log("Starting database seed...");

  try {
    // --- Upload /ingredients ---
    const ingredientsBatch = writeBatch(db);
    ingredientsData.forEach(ing => {
      const docRef = doc(db, "ingredients", ing.id);
      ingredientsBatch.set(docRef, ing);
    });
    await ingredientsBatch.commit();
    console.log("Ingredients directory loaded!");

    // --- Upload /users/{userID} ---
    const userDocRef = doc(db, "users", MOCK_USER_ID);
    await setDoc(userDocRef, mockUser1Data);
    console.log("Mock user profile created!");

    // --- Upload /users/{userID}/pantry ---
    const pantryBatch = writeBatch(db);
    mockUser1Pantry.forEach(item => {
      const docRef = doc(db, "users", MOCK_USER_ID, "pantry", item.id);
      pantryBatch.set(docRef, item);
    });
    await pantryBatch.commit();
    console.log("User pantry (fridge) stocked!");

    // --- Upload /users/{userID}/mealPlans ---
    const mealPlanBatch = writeBatch(db);
    mockUser1MealPlans.forEach(plan => {
      const docRef = doc(db, "users", MOCK_USER_ID, "mealPlans", plan.id);
      mealPlanBatch.set(docRef, plan);
    });
    await mealPlanBatch.commit();
    console.log("User meal plan created!");

    // --- Upload /users/{userID}/savedRecipes ---
    const savedRecipesBatch = writeBatch(db);
    mockUser1SavedRecipes.forEach(recipe => {
      const docRef = doc(db, "users", MOCK_USER_ID, "savedRecipes", recipe.id);
      savedRecipesBatch.set(docRef, recipe);
    });
    await savedRecipesBatch.commit();
    console.log("User saved recipes (favorites) added!");

    // --- Upload /users/{userID}/shoppingLists ---
    const shoppingListRef = doc(db, "users", MOCK_USER_ID, "shoppingLists", mockUser1ShoppingList.id);
    await setDoc(shoppingListRef, mockUser1ShoppingList);
    console.log("User shopping list created!");
    
    console.log("All mock data successfully uploaded! ---");
    alert("All mock data successfully uploaded!");

  } catch (error) {
    console.error("Error seeding database: ", error);
    alert("Error seeding database: " + error.message);
  }
}