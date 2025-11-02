import { useState, useEffect, useMemo   } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import DailyMealPlan from "../components/DailyMealPlan";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import { getISOWeekYear, getISOWeek } from 'date-fns';
import ShoppingListCard from '../components/ShoppingListCard';
import FavoriteRecipes from '../components/FavoriteRecipes';
import styles from '../css/Home.module.css';

import { goals } from '../components/stat/goalsData.js';
import { GoalCard } from '../components/stat/GoalCard';
import stylesGC from '../css/Statistics.module.css';

const getDay = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};
function Home() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [homeSettings, setHomeSettings] = useState({
    mealPlan: true,
    shoppingList: true,
    statistics: true,
    savedRecipes: true
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);  

  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleSettingVisibility = (key) => {
    setHomeSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const todayKey = Object.keys(data?.weekPlan || {}).find(
    k => k.toLowerCase() === getDay(new Date()).toLowerCase()
  );
  
  const todayMeals = todayKey ? data.weekPlan[todayKey] : null;
  const calorieGoal = goals.find(g => g.label === 'Calories');

  // Mock data
  // const mealPlan = [
  //   { type: 'Breakfast', meal: 'Oatmeal with berries', time: '8:00 AM', calories: 350 },
  //   { type: 'Lunch', meal: 'Grilled chicken salad', time: '12:30 PM', calories: 450 },
  //   { type: 'Dinner', meal: 'Salmon with vegetables', time: '7:00 PM', calories: 550 },
  //   { type: 'Snack', meal: 'Greek yogurt', time: '3:00 PM', calories: 150 }
  // ];

  // const statistics = {
  //   totalCookings: 47,
  //   totalCalories: 1847,
  //   savedRecipesCount: 23
  // };

  // const savedRecipes = [
  //   { id: 1, title: 'Pasta Carbonara', image: '/recipe1.jpg' },
  //   { id: 2, title: 'Chicken Curry', image: '/recipe2.jpg' },
  //   { id: 3, title: 'Greek Salad', image: '/recipe3.jpg' },
  //   { id: 4, title: 'Beef Tacos', image: '/recipe4.jpg' }
  // ];

  const shoppingList = [
    { name: 'Eggs', quantity: '12 pcs' },
    { name: 'Milk', quantity: '1 L' },
    { name: 'Chicken breast', quantity: '2 pcs' },
    { name: 'Broccoli', quantity: '1 head' },
    { name: 'Oats', quantity: '500 g' },
    { name: 'Greek yogurt', quantity: '2 cups' },
    { name: 'Berries', quantity: '200 g' },
    { name: 'Olive oil', quantity: '250 ml' }
  ];
  const documentId = `${getISOWeekYear(new Date())}-W${getISOWeek(new Date())}`;
  useEffect(() => {
    if (!currentUser) return;
  
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, "users", currentUser.uid, "mealPlans", documentId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData({ id: docSnap.id, ...docSnap.data() });
        } else {
          setData(null);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [currentUser]);

  return (
    <div className={styles.homePage}>
      {/* Main Content */}
        <div className={styles.gridContainer}>
          
          {/* Meal Plan Section - Top Left */}
          {homeSettings.mealPlan && (
            <div onClick={() => navigate('/dashboard')}>
                <div>
                    {loading && <p>Loading...</p>}
                    {error && <p>{error}</p>}
                    {!loading && !error && (
                      <DailyMealPlan
                        dayName={getDay(new Date())} 
                        dayMeals={todayMeals}
                      />
                    )}
                  </div>
                </div>      
          )}

          {/* Shopping List - Top Right */}
          {homeSettings.shoppingList && (
              <ShoppingListCard initialItems={shoppingList.map((item, index) => ({
                id: index + 1,
                name: item.name,
                checked: true
              }))} />
          )}

          {/* Statistics Section - Bottom Left */}
          {homeSettings.statistics && (
            <div onClick={() => navigate('/statistics')}>
              <div className={stylesGC.container}>
                  <GoalCard goal={calorieGoal} styles={stylesGC} />
                </div>
            </div>
          )}

          {/* Saved Recipes Section - Bottom Right */}
          {homeSettings.savedRecipes && (
            <div className={styles.recipesSection} onClick={() => navigate('/recipes/saved')}>
              <FavoriteRecipes />
            </div>
          )}
          {/* Edit Home Button */}
          <button className={styles.editHomeBtn} onClick={() => setShowSettings(!showSettings)}>
            ⚙️ Edit Home
          </button>
          {showSettings && (
          <div className={styles.settingsOverlay} onClick={() => setShowSettings(false)}>
            <div className={styles.settingsPanel} onClick={(e) => e.stopPropagation()}>
              <div className={styles.settingsHeader}>
                <h3>Home Settings</h3>
                <button className={styles.closeBtn} onClick={() => setShowSettings(false)}>✕</button>
              </div>
              <p className={styles.settingsDescription}>
                Choose the sections you want to see on your home screen.
              </p>
              <div className={styles.settingsList}>
                <div className={styles.settingItem}>
                  <span>Meal Plan</span>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={homeSettings.mealPlan}
                      onChange={() => toggleSettingVisibility('mealPlan')}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <span>Shopping List</span>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={homeSettings.shoppingList}
                      onChange={() => toggleSettingVisibility('shoppingList')}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <span>Statistics</span>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={homeSettings.statistics}
                      onChange={() => toggleSettingVisibility('statistics')}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <span>Saved Recipes</span>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={homeSettings.savedRecipes}
                      onChange={() => toggleSettingVisibility('savedRecipes')}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
    </div>
  );
}

export default Home;