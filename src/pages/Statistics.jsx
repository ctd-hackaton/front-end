import { useState } from 'react';
import { Header } from '../components/stat/Header';
import { GoalCards } from '../components/stat/GoalCards';
import { WeeklyChart } from '../components/stat/WeeklyChart';
import { MacroChart } from '../components/stat/MacroChart';
import { IngredientsChart } from '../components/stat/IngredientsChart';
import { MealsChart } from '../components/stat/MealsChart';
import styles from '../css/Statistics.module.css';

export default function Statistics() {
  
  return (
    <div className={styles.dashboard}>
      <div className={styles.container}>
        <GoalCards styles={styles}/>
        
        <div className={styles.charts}>
          <WeeklyChart />
          <MacroChart />
          <IngredientsChart />
          <div className={`${styles.chartCard} ${styles.full}`}>
            <MealsChart />
          </div>
        </div>
      </div>
    </div>
  );
}