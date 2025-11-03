import { Flame, Drumstick, Wheat, Droplet } from 'lucide-react';

/**
 * day nutrition calculation
 */
export const calculateDayNutrition = (dayMeals, goals = null) => {
  if (!dayMeals || typeof dayMeals !== "object") {
    return {
      calories: 0, carbs: 0, fats: 0, protein: 0,
      caloriesGoal: goals?.dailyCalorieTarget || 0,
      carbsGoal: goals?.carbsGoalGrams || 0,
      fatsGoal: goals?.fatsGoalGrams || 0,
      proteinGoal: goals?.proteinGoalGrams || 0,
    };
  }

  let calories = 0, carbs = 0, fats = 0, protein = 0;

  Object.values(dayMeals).forEach((meal) => {
    if (meal?.nutrition) {
      calories += meal.nutrition.calories || 0;
      carbs += meal.nutrition.carbs || 0;
      fats += meal.nutrition.fats || 0;
      protein += meal.nutrition.protein || 0;
    }
  });

  return {
    calories, carbs, fats, protein,
    caloriesGoal: goals?.dailyCalorieTarget || 0,
    carbsGoal: goals?.carbsGoalGrams || 0,
    fatsGoal: goals?.fatsGoalGrams || 0,
    proteinGoal: goals?.proteinGoalGrams || 0,
  };
};


/**
 * day ingredients collection
 */
export const collectDayIngredients = (dayMeals) => {
  if (!dayMeals || typeof dayMeals !== "object") return [];
  const ingredients = [];
  Object.values(dayMeals).forEach((meal) => {
    if (Array.isArray(meal.ingredients)) {
      meal.ingredients.forEach((ing) => {
        ingredients.push({
          ...ing,
          mealName: meal.name || "Unknown Meal",
        });
      });
    }
  });
  return ingredients;
};

export const collectDayIngredientsSorted = (dayMeals) => {
  if (!dayMeals || typeof dayMeals !== "object") return [];

  const countMap = {};

  Object.values(dayMeals).forEach((meal) => {
    if (Array.isArray(meal.ingredients)) {
      meal.ingredients.forEach((ing) => {
        const key = ing.item?.trim();
        if (!key) return;
        countMap[key] = (countMap[key] || 0) + 1;
      });
    }
  });

  const sorted = Object.entries(countMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count); 

  return sorted;
};


/**
 * weekly plan processing
 */
export const processWeeklyPlan = (weekPlan, goals = null) => {
  if (!weekPlan || typeof weekPlan !== "object") return [];

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return daysOfWeek.map((day) => {
    const dayKey = Object.keys(weekPlan).find(
      (k) => k.toLowerCase() === day.toLowerCase()
    );
    const dayMeals = dayKey ? weekPlan[dayKey] : null;

    const nutrition = calculateDayNutrition(dayMeals, goals);
    const ingredients = collectDayIngredients(dayMeals);

    return {
      day,
      nutrition,
      ingredients,
    };
  });
};


/**
 * total nutrition and ingredients for the week
 */
export const calculateWeeklyTotals = (weekPlan, goals = null) => {
  const weeklyData = processWeeklyPlan(weekPlan, goals);

  const totalNutrition = weeklyData.reduce(
    (acc, d) => {
      acc.calories += d.nutrition.calories;
      acc.carbs += d.nutrition.carbs;
      acc.fats += d.nutrition.fats;
      acc.protein += d.nutrition.protein;
      return acc;
    },
    { calories: 0, carbs: 0, fats: 0, protein: 0 }
  );

  const allIngredients = weeklyData.flatMap((d) => d.ingredients);

  return {
    totalNutrition,
    allIngredients,
  };
};


/**
 * Goals array for GoalCard components
 */
export const buildGoalsArray = (nutrition, goals) => {
  if (!nutrition || !goals) return [];

  return [
    {
      label: "Calories",
      target: goals.dailyCalorieTarget || 0,
      current: Math.round(nutrition.calories || 0),
      unit: "kcal",
      icon: Flame,
    },
    {
      label: "Protein",
      target: goals.proteinGoalGrams || 0,
      current: Math.round(nutrition.protein || 0),
      unit: "g",
      icon: Drumstick,
    },
    {
      label: "Carbs",
      target: goals.carbsGoalGrams || 0,
      current: Math.round(nutrition.carbs || 0),
      unit: "g",
      icon: Wheat,
    },
    {
      label: "Fats",
      target: goals.fatsGoalGrams || 0,
      current: Math.round(nutrition.fats || 0),
      unit: "g",
      icon: Droplet,
    },
  ];
};

/**
 * aggregated ingredients for the whole week
 */
export const getWeeklyIngredientsSorted = (weekPlan) => {
  if (!weekPlan || typeof weekPlan !== "object") return [];

  const ingredientSet = new Set();
  const countMap = {};
  
  Object.values(weekPlan).forEach(dayMeals => {
    if (!dayMeals) return;
    Object.values(dayMeals).forEach(meal => {
      if (!meal.ingredients) return;
      meal.ingredients.forEach(ing => {
        const name = ing.item?.trim().toLowerCase(); 
        if (!name) return;
        countMap[name] = (countMap[name] || 0) + 1;
      });
    });
  });

  return Object.entries(countMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count); 
};


/**
 * ingredients for today
 */
export const getTodayIngredients = (weekPlan) => {
  if (!weekPlan || typeof weekPlan !== "object") return [];

  const todayIndex = new Date().getDay(); 
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = daysOfWeek[todayIndex];

  const dayKey = Object.keys(weekPlan).find(
    (k) => k.toLowerCase() === todayName.toLowerCase()
  );

  const dayMeals = dayKey ? weekPlan[dayKey] : null;
  return collectDayIngredients(dayMeals);
};

/**
 * Format data for DailyCaloriesChart component
 */
export const formatChartData = (weeklyData) => {
  if (!Array.isArray(weeklyData) || weeklyData.length === 0) {
    return [];
  }

  const dayAbbreviations = {
    "Monday": "Mon",
    "Tuesday": "Tue",
    "Wednesday": "Wed",
    "Thursday": "Thu",
    "Friday": "Fri",
    "Saturday": "Sat",
    "Sunday": "Sun"
  };

  return weeklyData.map((dayData) => ({
    day: dayAbbreviations[dayData.day] || dayData.day.substring(0, 3),
    calories: Math.round(dayData.nutrition.calories || 0),
    target: dayData.nutrition.caloriesGoal || 0
  }));
};
