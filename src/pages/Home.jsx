import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import styles from '../css/Home.module.css';

function Home() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [homeSettings, setHomeSettings] = useState({
    chat: true,
    mealPlan: true,
    statistics: true,
    savedRecipes: true
  });

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleSettingVisibility = (key) => {
    setHomeSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Mock data
  const mealPlan = [
    { type: 'Breakfast', meal: 'Oatmeal with berries', time: '8:00 AM', calories: 350 },
    { type: 'Lunch', meal: 'Grilled chicken salad', time: '12:30 PM', calories: 450 },
    { type: 'Dinner', meal: 'Salmon with vegetables', time: '7:00 PM', calories: 550 },
    { type: 'Snack', meal: 'Greek yogurt', time: '3:00 PM', calories: 150 }
  ];

  const statistics = {
    totalCookings: 47,
    totalCalories: 1847,
    savedRecipesCount: 23
  };

  const savedRecipes = [
    { id: 1, title: 'Pasta Carbonara', image: '/recipe1.jpg' },
    { id: 2, title: 'Chicken Curry', image: '/recipe2.jpg' },
    { id: 3, title: 'Greek Salad', image: '/recipe3.jpg' },
    { id: 4, title: 'Beef Tacos', image: '/recipe4.jpg' }
  ];

  return (
    <div className={styles.homePage}>
      {/* Main Content */}
        <div className={styles.gridContainer}>
          
          {/* Chat Section - Top Left */}
          {homeSettings.chat && (
            <div className={styles.chatSection} onClick={() => navigate('/chat')}>
              <div className={styles.blurOverlay}>
                <div className={styles.chatPreview}>
                  <div className={styles.messagePreview}>
                    <div className={styles.userMessage}>What should I cook for dinner?</div>
                    <div className={styles.assistantMessage}>
                      Based on your fridge inventory, I recommend...
                    </div>
                  </div>
                  <div className={styles.clickPrompt}>
                    <span className={styles.chatIcon}>💬</span>
                    <span>Click to open Meal Planning Chat</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Meal Plan Section - Top Right */}
          {homeSettings.mealPlan && (
            <div className={styles.mealPlanSection} onClick={() => navigate('/meal-planner')}>
              <div className={styles.sectionHeader}>
                <h3>📅 Today's Meal Plan</h3>
              </div>
              <div className={styles.mealPlanList}>
                {mealPlan.map((meal, index) => (
                  <div key={index} className={styles.mealItem}>
                    <div className={styles.mealType}>{meal.type}</div>
                    <div className={styles.mealDetails}>
                      <span className={styles.mealName}>{meal.meal}</span>
                      <span className={styles.mealTime}>{meal.time}</span>
                    </div>
                    <div className={styles.mealCalories}>{meal.calories} kcal</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statistics Section - Bottom Left */}
          {homeSettings.statistics && (
            <div className={styles.statisticsSection} onClick={() => navigate('/statistics')}>
              <div className={styles.sectionHeader}>
                <h3>📈 Quick Stats</h3>
              </div>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>{statistics.totalCookings}</div>
                  <div className={styles.statLabel}>Total Cookings</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>{statistics.totalCalories}</div>
                  <div className={styles.statLabel}>Today's Calories</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>{statistics.savedRecipesCount}</div>
                  <div className={styles.statLabel}>Saved Recipes</div>
                </div>
              </div>
            </div>
          )}

          {/* Saved Recipes Section - Bottom Right */}
          {homeSettings.savedRecipes && (
            <div className={styles.recipesSection} onClick={() => navigate('/recipes/saved')}>
              <div className={styles.sectionHeader}>
                <h3>❤️ Saved Recipes</h3>
              </div>
              <div className={styles.recipesGrid}>
                {savedRecipes.map((recipe) => (
                  <div key={recipe.id} className={styles.recipeCard}>
                    <div className={styles.recipeImage}>
                      <div className={styles.recipePlaceholder}>🍽️</div>
                    </div>
                    <div className={styles.recipeTitle}>{recipe.title}</div>
                  </div>
                ))}
              </div>
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
                  <span>Chat Preview</span>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={homeSettings.chat}
                      onChange={() => toggleSettingVisibility('chat')}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
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