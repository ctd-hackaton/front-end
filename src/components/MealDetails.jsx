import { MdClose, MdFavorite, MdThumbDown } from 'react-icons/md';
import styles from "../css/dashboard/MealDetails.module.css";

function MealDetails({ mealType, mealData, onClose }) {
  if (!mealData) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.mealTitleContainer}>
          <h3 className={styles.mealTitle}>{mealType}</h3>
          <h3 className={styles.mealName}>{mealData.name}</h3>
        </div>
        <div className={styles.actionButtons}>
          <button className={styles.iconButton}>
            <MdFavorite />
          </button>
          <button className={styles.iconButton}>
            <MdThumbDown />
          </button>
          <button className={styles.iconButton} onClick={onClose}>
            <MdClose />
          </button>
        </div>
      </div>

      <div className={styles.content}>

        <div className={styles.description}>
          <span>{mealData.description}</span>
        </div>

        <div>
          <div className={styles.ingredientsList}>
            {mealData.ingredients.map((ingredient, index) => (
              <div key={index} className={styles.ingredient}>
                <span>{ingredient.item}</span>
                <span className={styles.ingredientDetails}>
                  {ingredient.amount} {ingredient.unit} ({ingredient.category})
                </span>
              </div>
            ))}
          </div>
        </div>

        {mealData.nutrition && (
          <div>
            <div className={styles.nutritionGrid}>
              {[
                { key: 'calories', label: 'Calories', unit: '' },
                { key: 'carbs', label: 'Carbs', unit: 'g' },
                { key: 'fats', label: 'Fats', unit: 'g' },
                { key: 'protein', label: 'Protein', unit: 'g' }
              ]
                .filter(item => mealData.nutrition[item.key] !== undefined)
                .map(item => (
                  <div key={item.key} className={styles.nutritionItem}>
                    <span className={styles.nutritionLabel}>{item.label}:</span>
                    <span className={styles.nutritionValue}>
                      {mealData.nutrition[item.key]}{item.unit}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MealDetails;

