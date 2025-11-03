import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { ChefHat } from "lucide-react";
import styles from "../css/home/CreateMealPlanCard.module.css";

function CreateMealPlanCard() {
  const navigate = useNavigate();

  return (
    <div className={styles.card} onClick={() => navigate("/chat")}>
      <div className={styles.iconWrapper}>
        <ChefHat size={48} className={styles.icon} />
      </div>
      <h3 className={styles.title}>Create Meal Plan</h3>
      <p className={styles.description}>
        Chat with Chef Jul to create a personalized meal plan for your week
      </p>
      <button className={styles.button}>Get Started</button>
    </div>
  );
}

export default memo(CreateMealPlanCard);
