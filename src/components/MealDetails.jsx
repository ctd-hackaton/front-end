import { MdClose, MdFavorite, MdThumbDown, MdFavoriteBorder } from 'react-icons/md';
import { Clock, ChefHat, Users, Flame, Wheat, Droplet } from 'lucide-react';
import styles from "../css/dashboard/MealDetails.module.css";

function MealDetails({ mealType, mealData, onClose, onDislike, onLike, isLiked = false }) {
  if (!mealData) return null;

  return (
    <div className={styles.container}>

      <div className={styles.heroImage}>
        <img
          src={mealData.imageUrl}
          alt={mealData.name}
          className={styles.mealImage}
        />
        <div className={styles.badge}>
          {mealType}
        </div>
        <div className={styles.actionButtonsOverlay}>
          <button
            className={styles.iconButton}
            onClick={() => onLike && onLike(mealType, mealData)}
          >
            {isLiked ? <MdFavorite /> : <MdFavoriteBorder />}
          </button>
          <button className={styles.iconButton} onClick={onDislike}>
            <MdThumbDown />
          </button>
          <button className={styles.iconButton} onClick={onClose}>
            <MdClose />
          </button>
        </div>
      </div>

      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>{mealData.name}</h2>
          <p className={styles.description}>{mealData.description}</p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.quickInfo}>
          <div className={styles.infoItem}>
            <Clock className={styles.infoIcon} />
            <div>
              <div className={styles.infoLabel}>Prep Time</div>
              <div className={styles.infoValue}>{mealData.recipe.prepTime}</div>
            </div>
          </div>
          <div className={styles.infoItem}>
            <ChefHat className={styles.infoIcon} />
            <div>
              <div className={styles.infoLabel}>Cook Time</div>
              <div className={styles.infoValue}>{mealData.recipe.cookTime}</div>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.difficultyDotContainer}>
              <div className={styles.difficultyDot}></div>
            </div>
            <div>
              <div className={styles.infoLabel}>Difficulty</div>
              <div className={styles.infoValue}>{mealData.recipe.difficulty}</div>
            </div>
          </div>
          <div className={styles.infoItem}>
            <Users className={styles.infoIcon} />
            <div>
              <div className={styles.infoLabel}>Servings</div>
              <div className={styles.infoValue}>{mealData.recipe.servings}</div>
            </div>
          </div>
        </div>

        <div className={styles.separator} />

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Ingredients</h3>
          <div className={styles.ingredientsList}>
            {mealData.ingredients.map((ingredient, index) => (
              <div key={index} className={styles.ingredient}>
                <span>{ingredient.item}</span>
                <span className={styles.ingredientDetails}>
                  {ingredient.amount} {ingredient.unit} <span className={styles.ingredientCategory}>({ingredient.category})</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.separator} />
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Nutrition</h3>
          <div className={styles.nutritionGrid}>
            {[
              { key: 'calories', label: 'Calories', Icon: Flame, color: '#0d9488', unit: '' },
              { key: 'carbs', label: 'Carbs', Icon: Wheat, color: '#7c3aed', unit: 'g' },
              { key: 'fats', label: 'Fats', Icon: Droplet, color: '#d97706', unit: 'g' },
              { key: 'protein', label: 'Protein', Icon: ChefHat, color: '#dc2626', unit: 'g' }
            ]
              .filter(item => mealData.nutrition[item.key] !== undefined)
              .map(item => (
                <div key={item.key} className={styles.nutritionItem}>
                  <item.Icon className={styles.nutritionIcon} style={{ color: item.color }} />
                  <div>
                    <div className={styles.nutritionLabel}>{item.label}</div>
                    <div className={styles.nutritionValue}>
                      {mealData.nutrition[item.key]}{item.unit}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className={styles.separator} />

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Instructions</h3>
          <ol className={styles.stepsList}>
            {mealData.recipe.steps.map((step, index) => (
              <li key={index} className={styles.step}>
                <span className={styles.stepNumber}>{index + 1}</span>
                <span className={styles.stepText}>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className={styles.separator} />
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Tips</h3>
          <ul className={styles.tipsList}>
            {mealData.recipe.tips.map((tip, index) => (
              <li key={index} className={styles.tip}>
                <span className={styles.tipText}>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default MealDetails;

