import { Flame, Drumstick, Wheat, Droplet } from 'lucide-react';

const goals = [
  { label: 'Calories', target: 2100, current: 1950, unit: 'kcal', icon: Flame },
  { label: 'Protein', target: 150, current: 142, unit: 'g', icon: Drumstick },
  { label: 'Carbs', target: 250, current: 235, unit: 'g', icon: Wheat },
  { label: 'Fats', target: 70, current: 65, unit: 'g', icon: Droplet },
];

export function GoalCards({ styles }) {
  return (
    <div className={styles.goals}>
      {goals.map((goal) => {
        const Icon = goal.icon;
        const percent = Math.round((goal.current / goal.target) * 100);
        
        return (
          <div key={goal.label} className={styles.goalCard}>
            <div className={styles.goalHeader}>
              <div>
                <div className={styles.goalLabel}>{goal.label}</div>
                <div className={styles.goalValue}>
                  {goal.target}
                  <span className={styles.goalUnit}>{goal.unit}</span>
                </div>
              </div>
              <Icon className={styles.goalIcon} size={24} />
            </div>
            
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${Math.min(percent, 100)}%` }} 
              />
            </div>
            
            <div className={styles.goalFooter}>
              <span className={styles.current}>{goal.current} {goal.unit}</span>
              <span>{percent}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}