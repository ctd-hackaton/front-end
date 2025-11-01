import { useState, useEffect, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../utils/firebase";
import { useAuth } from "../hooks/useAuth";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

import styles from "../css/Dashboard.module.css";

function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(new Date());
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchMealPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        const mealPlansRef = collection(db, "users", currentUser.uid, "mealPlans");
        const querySnapshot = await getDocs(mealPlansRef);
        const documents = [];
        querySnapshot.forEach((doc) => {
          documents.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setData(documents);
      } catch (err) {
        console.error("Error fetching meal plans:", err);
        setError("Failed to fetch meal plans");
      } finally {
        setLoading(false);
      }
    };

    fetchMealPlans();
  }, [currentUser]);

  const range = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust sun
    const monday = new Date(d);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return { start: monday, end: sunday };
  };

  const dateConvert = (timestamp) => {
    if (timestamp.toDate) {
      return timestamp.toDate();
    }
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
    }
    return null;
  };

  const filteredData = useMemo(() => {
    const { start, end } = range(selected);
    
    return data.filter((mealPlan) => {
      const selectedWeekDate = dateConvert(mealPlan.selectedWeek);
      return selectedWeekDate >= start && selectedWeekDate <= end;
    });
  }, [data, selected]);

  return (
    <>
      <DayPicker 
        showOutsideDays 
        animate 
        className={styles.dayPicker} 
        mode="single" 
        selected={selected} 
        onSelect={setSelected} 
        required
      />

      {selected && (
        <p>
          {(() => {
            const { start, end } = range(selected);
            return `Week: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
          })()}
        </p>
      )}

      <div>
        <h2>Meal Plans</h2>
        {loading && <p>Loading...</p>}
        {error && <p>Error</p>}
        {!loading && !error && (
          <div>
            {filteredData.length === 0 ? (
              <p>Nothing founded</p>
            ) : (
              filteredData.map((item) => (
                <div key={item.id}>{JSON.stringify(item, null, 2)}</div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default Dashboard;
