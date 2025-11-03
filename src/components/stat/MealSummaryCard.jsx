import { Clock } from 'lucide-react';
import styles from "../../css/Statistics.module.css";

const mealIcons = {
  'Breakfast': '🍳',
  'Lunch': '🥗',
  'Dinner': '🍽️',
  'Snack': '🍎'
};

const difficultyColors = {
  'Easy': 'var(--color-primary)',
  'Medium': 'var(--color-secondary)',
  'Hard': 'var(--danger)'
};

export function MealSummaryCard({ 
  mealType, 
  calories, 
  protein, 
  carbs, 
  fats, 
  cookTime, 
  difficulty,
  mealName = 'Today\'s meal'
}) {
  // Capitalize mealType if needed
  const formattedMealType = mealType.charAt(0).toUpperCase() + mealType.slice(1);
  const icon = mealIcons[formattedMealType] || '🍽️';
  const difficultyColor = difficultyColors[difficulty] || difficultyColors['Medium'];

  return (
    <div className={styles['meal-card']}>
      {/* Header */}
      <div className={styles['meal-header']}>
        <div className={styles['meal-header-content']}>
          <span className={styles['meal-icon']}>{icon}</span>
          <div>
            <h3 className={styles['meal-title']}>
              {formattedMealType}
            </h3>
            <p className={styles['meal-name']}>
              {mealName}
            </p>
          </div>
        </div>
        <div 
          className={styles['meal-difficulty']}
          style={{ 
            backgroundColor: `${difficultyColor}20`,
            color: difficultyColor
          }}
        >
          {difficulty}
        </div>
      </div>

      {/* Calories - Main Metric */}
      <div className={styles['meal-calories']}>
        <div className={styles['meal-calories-label']}>
          Calories
        </div>
        <div className={styles['meal-calories-value']}>
          {calories || 0}
          <span className={styles['meal-calories-unit']}>
            {' '}kcal
          </span>
        </div>
      </div>

      {/* Macros Grid */}
      <div className={styles['meal-macros']}>
        <div className={styles['meal-macro-item']}>
          <div className={styles['meal-macro-label']}>
            Protein
          </div>
          <div 
            className={styles['meal-macro-value']}
            style={{ color: 'var(--color-primary)' }}
          >
            {protein || 0}g
          </div>
        </div>
        <div className={styles['meal-macro-item']}>
          <div className={styles['meal-macro-label']}>
            Carbs
          </div>
          <div 
            className={styles['meal-macro-value']}
            style={{ color: 'var(--color-secondary)' }}
          >
            {carbs || 0}g
          </div>
        </div>
        <div className={styles['meal-macro-item']}>
          <div className={styles['meal-macro-label']}>
            Fats
          </div>
          <div 
            className={styles['meal-macro-value']}
            style={{ color: 'var(--color-accent)' }}
          >
            {fats || 0}g
          </div>
        </div>
      </div>

      {/* Cook Time */}
      <div className={styles['meal-footer']}>
        <Clock className={styles['meal-footer-icon']} />
        <span className={styles['meal-footer-text']}>
          {cookTime || 'N/A'}
        </span>
      </div>
    </div>
  );
}