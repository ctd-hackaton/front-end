

export function GoalCard({ goal, styles }) {
  const Icon = goal.icon;
  const percent = Math.round((goal.current / goal.target) * 100);

  return (
    <div className={styles.goalCard}>
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
}