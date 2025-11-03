import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';

import { DailyCaloriesChart } from "../components/stat/DailyCaloriesChart";
import { MacrosDonutChart } from "../components/stat/MacrosDonutChart";
import { MealSummaryCard } from "../components/stat/MealSummaryCard";
import { WeeklySummaryCard } from "../components/stat/WeeklySummaryCard";
import { TopIngredientsCloud } from "../components/stat/TopIngredientsCloud";
import { WeekSelector } from "../components/stat/WeekSelector";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import { getISOWeekYear, getISOWeek, addWeeks, subWeeks } from 'date-fns';
import { 
  calculateDayNutrition,
  getTodayIngredients,
  buildGoalsArray,
  processWeeklyPlan,
  calculateWeeklyTotals,
  formatChartData,
  getWeeklyIngredientsSorted 
} from '../utils/mealPlanUtils';

import styles from '../css/Statistics.module.css';

const getDay = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

export default function Statistics() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [weekPlan, setWeekPlan] = useState(null);
  const [userGoals, setUserGoals] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState("current");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const documentId = useMemo(() => {
    let targetDate = new Date();
    
    if (selectedWeek === "previous") {
      targetDate = subWeeks(targetDate, 1);
    } else if (selectedWeek === "next") {
      targetDate = addWeeks(targetDate, 1);
    }
    
    return `${getISOWeekYear(targetDate)}-W${getISOWeek(targetDate)}`;
  }, [selectedWeek]);

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const docRef = doc(db, "users", currentUser.uid, "mealPlans", documentId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setWeekPlan(docSnap.data().weekPlan);
        } else {
          setWeekPlan(null);
          console.log(`No data found for week: ${documentId}`);
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching week plan:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser, documentId, selectedWeek]); 

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchUserGoals = async () => {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUserGoals(userSnap.data().goals || null);
        }
      } catch (err) {
        console.error("Error fetching goals:", err);
      }
    };
    
    fetchUserGoals();
  }, [currentUser]);

  const todayKey = useMemo(() => {
    if (!weekPlan) return null;
    return Object.keys(weekPlan).find(
      k => k.toLowerCase() === getDay(new Date()).toLowerCase()
    );
  }, [weekPlan]);

  const todayMeals = todayKey ? weekPlan[todayKey] : null;

  const todayNutrition = useMemo(() => {
    return todayMeals && userGoals ? calculateDayNutrition(todayMeals, userGoals) : null;
  }, [todayMeals, userGoals]);

  const goalsArray = todayNutrition && userGoals ? buildGoalsArray(todayNutrition, userGoals) : [];

  const todayIngredients = useMemo(() => {
    return weekPlan ? getTodayIngredients(weekPlan) : [];
  }, [weekPlan]);

  const weeklyTotals = useMemo(() => {
    return weekPlan && userGoals ? calculateWeeklyTotals(weekPlan, userGoals) : { totalNutrition: null, allIngredients: [] };
  }, [weekPlan, userGoals]);

  const chartData = useMemo(() => {
    if (!weekPlan || !userGoals) return [];
    return formatChartData(processWeeklyPlan(weekPlan, userGoals));
  }, [weekPlan, userGoals]);
  
  const text = "Your nutrition plan is on track! Keep up the great work maintaining consistent meal patterns throughout the week.";
  const weeklyIngredients = getWeeklyIngredientsSorted(weekPlan).slice(0, 20);
  const cleanIngredients = weeklyIngredients
  .map(ing => ({ name: ing.name, count: ing.count }))
  .slice(0, 20); 
  console.log("todayMeals:", todayMeals);

  if (loading) {
    return (
      <div >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px',
          color: 'var(--text-primary)'
        }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px',
          color: 'var(--danger)'
        }}>
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!weekPlan) {
    return (
      <div >
        <div className={styles.weekContent}>
          <WeekSelector selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} />
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px',
          color: 'var(--text-muted)'
        }}>
          <p>No meal plan found for this week</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mainContent}>
      {/* <div className={styles.weekContent}>
        <WeekSelector selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} />
      </div> */}
      <header className={styles.header}>
        <h2 className={styles.pageTitle}>Nutrition Insights</h2>
        <p className={styles.pageSubtitle}>
          Track your daily nutrition and meal plans.
        </p>
      </header>
      
      <main className={styles.gridLayout}>
        <section className={styles.leftCol}>
          <DailyCaloriesChart data={chartData} />
          <MacrosDonutChart 
            protein={todayNutrition?.protein || 0} 
            carbs={todayNutrition?.carbs || 0} 
            fats={todayNutrition?.fats || 0} 
          />
        </section>

        <section className={styles.rightCol}>
          <WeeklySummaryCard 
            totalCalories={weeklyTotals.totalNutrition?.calories || 0}
            avgProtein={weeklyTotals.totalNutrition?.protein || 0}
            avgCarbs={weeklyTotals.totalNutrition?.carbs || 0}
            avgFats={weeklyTotals.totalNutrition?.fats || 0}
            balanceScore={87} 
          />
          <TopIngredientsCloud
            ingredients={cleanIngredients}
          />
        </section>
      </main>
      <section className={styles.mealsSection}>
          <h3 className={styles.mealsTitle}>Today's Meals</h3>
          <div className={styles.mealsGrid}>
            {todayMeals && Object.entries(todayMeals).map(([mealType, mealData]) => (
              <MealSummaryCard 
                key={mealType}
                mealType={mealType}
                mealName={mealData.name} 
                calories={mealData.nutrition?.calories}
                protein={mealData.nutrition?.protein}
                carbs={mealData.nutrition?.carbs}
                fats={mealData.nutrition?.fats}
                cookTime={mealData.recipe?.cookTime}
                difficulty={mealData.recipe?.difficulty}
            />
            ))}
          </div>
        </section>
      <div className={styles.insightFooter}>
          <div className={styles.insightInner}>
            <span className={styles.insightIcon}>💡</span>
            <div>
              <h4 className={styles.insightTitle}>AI Insight from Julie</h4>
              <p className={styles.insightText}>{text}</p>
            </div>
          </div>
        </div>
    </div>
  );
}