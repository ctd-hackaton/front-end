import { useState, useEffect, useMemo } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import { useAuth } from "../hooks/useAuth";
import { DayPicker } from "react-day-picker";
import { getISOWeekYear, getISOWeek } from 'date-fns';
import DailyMealPlan from "../components/DailyMealPlan";
import "react-day-picker/style.css";

import styles from "../css/Dashboard.module.css";

const getDay = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};


function Dashboard() {
  const [selected, setSelected] = useState(new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  const documentId = useMemo(() => {
    return `${`${getISOWeekYear(selected)}-W${getISOWeek(selected)}`}`;
  }, [selected]);

  useEffect(() => {
    if (!currentUser || !documentId) {
      setLoading(false);
      setData(null);
      return;
    }

    const fetchMealPlan = async () => {
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
        console.error("Error", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMealPlan();
  }, [currentUser, documentId]);


  return (
    <div className={styles.mainDash}>
      <div>
        <DayPicker
          showOutsideDays
          animate
          className={styles.dayPicker}
          mode="single"
          selected={selected}
          onSelect={setSelected}
          required
          showWeekNumber
          ISOWeek
        />
      </div>

      <div>
        {loading && <p>Loading...</p>}
        {error && <p>Error</p>}
        {!loading && !error && (
          <div>
            {!data || !data.weekPlan ? (
              <p>Nothing found</p>
            ) : (() => {
              const selectedDay = getDay(selected);
              const weekPlanKeys = Object.keys(data.weekPlan);
              const dayKey = weekPlanKeys.find(key =>
                key.toLowerCase() === selectedDay.toLowerCase()
              );

              const dayMeals = dayKey ? data.weekPlan[dayKey] : null;

              return <DailyMealPlan dayName={selectedDay} dayMeals={dayMeals} />;
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
