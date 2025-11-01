import styles from "../css/DailyMealPlan.module.css";

function DailyMealPlan({ dayName, dayMeals }) {
  const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'];

  const getMealOrder = (mealType) => {
    const index = mealOrder.findIndex(order => order.toLowerCase() === mealType.toLowerCase());
    return index !== -1 ? index : 10;
  };

  if (!dayMeals) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Meal Plan - {dayName}</h2>
        </div>
        <p className={styles.noMeals}>No meal plan found for {dayName}</p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Meal Plan - {dayName}</h2>
      </div>
      {dayMeals && (
        <div className={styles.mealList}>
          {Object.entries(dayMeals)
            .sort(([a], [b]) => getMealOrder(a) - getMealOrder(b))
            .map(([mealType, mealData]) => (
              <div key={mealType} className={styles.mealRow}>
                <div className={styles.mealType}>{mealType}</div>
                <div className={styles.mealContent}>
                  {mealData.description && (
                    <p className={styles.mealDescription}>{mealData.description}</p>
                  )}
                  <p className={styles.mealTime}>{mealData.time || ""}</p>
                </div>
                <div className={styles.calories}>
                  {mealData.nutrition?.calories ? `${mealData.nutrition.calories} kcal` : ""}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default DailyMealPlan;

