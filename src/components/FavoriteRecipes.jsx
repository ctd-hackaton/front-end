import { useState, useEffect, memo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../utils/firebase";
import { useAuth } from "../hooks/useAuth";
import styles from "../css/home/FavoriteRecipes.module.css";
import { Heart } from "lucide-react";

const FavoriteRecipes = () => {
  const { currentUser } = useAuth();
  const [likedRecipes, setLikedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchLikedRecipes = async () => {
      try {
        const likedRef = collection(db, "users", currentUser.uid, "liked");
        const likedSnap = await getDocs(likedRef);
        const recipes = [];

        likedSnap.forEach((doc) => {
          recipes.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setLikedRecipes(recipes);
      } catch (err) {
        console.error("Error fetching liked recipes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedRecipes();
  }, [currentUser]);

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <Heart size={24} color="#ef4444" fill="none" />
          &nbsp;
          <h2 className={styles.title}>Favorite Recipes</h2>
        </div>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (likedRecipes.length === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <Heart size={24} color="#ef4444" fill="none" />
          &nbsp;
          <h2 className={styles.title}>Favorite Recipes</h2>
        </div>
        <div className={styles.emptyState}>
          <p>No favorite recipes yet</p>
          <p className={styles.emptyHint}>
            Like recipes from your meal plan to see them here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Heart size={24} color="#ef4444" fill="#ef4444" />
        &nbsp;
        <h2 className={styles.title}>Favorite Recipes</h2>
      </div>

      <div className={styles.imagesContainer}>
        {likedRecipes.map((recipe) => (
          <div key={recipe.id} className={styles.imageCard}>
            {recipe.imageUrl ? (
              <div className={styles.imageWrapper}>
                <img
                  src={recipe.imageUrl}
                  alt={recipe.name}
                  className={styles.image}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentElement.classList.add(
                      styles.imagePlaceholder
                    );
                  }}
                />
              </div>
            ) : (
              <div
                className={`${styles.imageWrapper} ${styles.imagePlaceholder}`}
              >
                <span className={styles.placeholderIcon}>🍽️</span>
              </div>
            )}
            <div className={styles.recipeInfo}>
              <h3 className={styles.imageTitle}>
                {recipe.name || "Untitled Recipe"}
              </h3>
              {recipe.description && (
                <p className={styles.description}>{recipe.description}</p>
              )}
              {recipe.nutrition ? (
                <div className={styles.macros}>
                  <span className={styles.macro}>
                    {Math.round(recipe.nutrition.calories || 0)} cal
                  </span>
                  <span className={styles.macroDivider}>•</span>
                  <span className={styles.macro}>
                    P: {Math.round(recipe.nutrition.protein || 0)}g
                  </span>
                  <span className={styles.macroDivider}>•</span>
                  <span className={styles.macro}>
                    C: {Math.round(recipe.nutrition.carbs || 0)}g
                  </span>
                  <span className={styles.macroDivider}>•</span>
                  <span className={styles.macro}>
                    F: {Math.round(recipe.nutrition.fats || 0)}g
                  </span>
                </div>
              ) : (
                <div className={styles.noNutrition}>
                  <span className={styles.muted}>
                    Nutrition info not available
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(FavoriteRecipes);
