import { GoalCard } from './GoalCard';
import { calculateDayNutrition, buildGoalsArray } from "../../utils/mealPlanUtils";

export function GoalCards({ styles, weekPlan, userGoals, selectedDay = "Monday" }) {
  if (!weekPlan || !userGoals) {
    return <p>No goals data available</p>;
  }

  const dayMeals = weekPlan[selectedDay];
  const nutrition = calculateDayNutrition(dayMeals, userGoals);
  const goalsArray = buildGoalsArray(nutrition, userGoals);
  
  return (
    <div className={styles.goals}>
      {goalsArray .map((goal) => (
        <GoalCard key={goal.label} goal={goal} styles={styles} />
      ))}
    </div>
  );
}