import { goals } from './goalsData.js'; 
import { GoalCard } from './GoalCard';

export function GoalCards({ styles }) {
  return (
    <div className={styles.goals}>
      {goals.map((goal) => (
        <GoalCard key={goal.label} goal={goal} styles={styles} />
      ))}
    </div>
  );
}