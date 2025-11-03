import { TrendingUp, Award } from 'lucide-react';
import styles from "../../css/Statistics.module.css";

export function WeeklySummaryCard({ 
  totalCalories, 
  avgProtein, 
  avgCarbs, 
  avgFats, 
  balanceScore 
}) {
  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--color-primary)';
    if (score >= 60) return 'var(--color-secondary)';
    return 'var(--danger)';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <div className={styles['summary-card']}>
      {/* Header */}
      <div className={styles['summary-header']}>
        <div className={styles['summary-header-content']}>
          <div className={styles['summary-icon-wrapper']}>
            <Award className={styles['summary-icon']} />
          </div>
          <div>
            <h3 className={styles['summary-title']}>
              Weekly Summary
            </h3>
            <p className={styles['summary-subtitle']}>
              7-day nutrition overview
            </p>
          </div>
        </div>
        <TrendingUp className={styles['summary-trend-icon']} />
      </div>

      {/* Total Calories */}
      <div className={styles['summary-total']}>
        <div className={styles['summary-total-label']}>
          Total Weekly Calories
        </div>
        <div className={styles['summary-total-value']}>
          {totalCalories.toLocaleString()}
          <span className={styles['summary-total-unit']}>
            {' '}kcal
          </span>
        </div>
      </div>

      {/* Average Macros */}
      <div className={styles['summary-macros']}>
        <div className={styles['summary-macro-item']}>
          <div className={styles['summary-macro-label']}>
            Avg Protein
          </div>
          <div 
            className={styles['summary-macro-value']}
            style={{ color: 'var(--color-primary)' }}
          >
            {avgProtein}g
          </div>
          <div className={styles['summary-macro-period']}>
            per day
          </div>
        </div>
        <div className={styles['summary-macro-item']}>
          <div className={styles['summary-macro-label']}>
            Avg Carbs
          </div>
          <div 
            className={styles['summary-macro-value']}
            style={{ color: 'var(--color-secondary)' }}
          >
            {avgCarbs}g
          </div>
          <div className={styles['summary-macro-period']}>
            per day
          </div>
        </div>
        <div className={styles['summary-macro-item']}>
          <div className={styles['summary-macro-label']}>
            Avg Fats
          </div>
          <div 
            className={styles['summary-macro-value']}
            style={{ color: 'var(--color-accent)' }}
          >
            {avgFats}g
          </div>
          <div className={styles['summary-macro-period']}>
            per day
          </div>
        </div>
      </div>

      {/* Nutrition Balance Score */}
      <div className={styles['summary-score']}>
        <div className={styles['summary-score-header']}>
          <span className={styles['summary-score-label']}>
            Nutrition Balance Score
          </span>
          <div className={styles['summary-score-value-wrapper']}>
            <div 
              className={styles['summary-score-value']}
              style={{ color: getScoreColor(balanceScore) }}
            >
              {balanceScore}/100
            </div>
            <div className={styles['summary-score-status']}>
              {getScoreLabel(balanceScore)}
            </div>
          </div>
        </div>
        <div className={styles['summary-score-bar']}>
          <div 
            className={styles['summary-score-fill']}
            style={{ 
              width: `${balanceScore}%`,
              background: `linear-gradient(90deg, var(--color-primary-600), ${getScoreColor(balanceScore)})`
            }}
          />
        </div>
      </div>
    </div>
  );
}