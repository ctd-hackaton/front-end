import { useState, useEffect, useMemo } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import { useAuth } from "../hooks/useAuth";
import { DayPicker } from "react-day-picker";
import { getISOWeekYear, getISOWeek } from 'date-fns';
import "react-day-picker/style.css";

import styles from "../css/Dashboard.module.css";


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
    <>
      <DayPicker 
        showOutsideDays 
        animate 
        className={styles.dayPicker} 
        mode="single" 
        selected={selected} 
        onSelect={setSelected} 
        required
        ISOWeek
      />

      {selected && (
        <p>
          {(() => {
            return `Week ${getISOWeek(selected)}`;
          })()}
        </p>
      )}

      <div>
        <h2>Meal Plans</h2>
        {documentId && <p>Document ID: {documentId}</p>}
        {loading && <p>Loading...</p>}
        {error && <p>Error</p>}
        {!loading && !error && (
          <div>
            {!data ? (
              <p>Nothing founded</p>
            ) : (
              <div>{JSON.stringify(data, null, 2)}</div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default Dashboard;
