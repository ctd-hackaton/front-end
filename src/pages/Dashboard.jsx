import { useState, useEffect, useMemo } from "react";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../utils/firebase";
import { useAuth } from "../hooks/useAuth";
import { DayPicker } from "react-day-picker";
import { getISOWeekYear, getISOWeek } from "date-fns";
import DailyMealPlan from "../components/DailyMealPlan";
import WeeklyStats from "../components/WeeklyStats";
import MealDetails from "../components/MealDetails";
import SmallChat from "./SmallChat";
import "react-day-picker/style.css";

import styles from "../css/dashboard/Dashboard.module.css";

const getDay = (date) => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[date.getDay()];
};

function Dashboard() {
  const [selected, setSelected] = useState(new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [likedMeals, setLiked] = useState(new Set());
  const { currentUser } = useAuth();

  const handleLike = async (mealType, mealData, dayName) => {
    if (!currentUser || !mealData?.name) return;

    const isLiked = likedMeals.has(mealData.name);

    try {
      if (isLiked) {
        const likedRef = collection(db, "users", currentUser.uid, "liked");
        const q = query(likedRef, where("name", "==", mealData.name));
        const querySnapshot = await getDocs(q);

        const deletePromises = []; // for duplicated names
        querySnapshot.forEach((docSnapshot) => {
          deletePromises.push(deleteDoc(docSnapshot.ref));
        });
        await Promise.all(deletePromises);

        const selectedDay = dayName || getDay(selected);
        const weekPlanKeys = Object.keys(data.weekPlan || {});
        const dayKey = weekPlanKeys.find(
          (key) => key.toLowerCase() === selectedDay.toLowerCase()
        );

        if (dayKey && data.weekPlan[dayKey]?.[mealType]) {
          const planRef = doc(
            db,
            "users",
            currentUser.uid,
            "mealPlans",
            documentId
          );
          const updPlan = { ...data.weekPlan };
          updPlan[dayKey] = {
            ...updPlan[dayKey],
            [mealType]: {
              ...updPlan[dayKey][mealType],
              liked: false,
            },
          };
          await setDoc(planRef, { weekPlan: updPlan }, { merge: true });

          setData({ ...data, weekPlan: updPlan });
        }

        setLiked((prev) => {
          const newSet = new Set(prev);
          newSet.delete(mealData.name);
          return newSet;
        });
      } else {
        const likedRef = collection(db, "users", currentUser.uid, "liked");
        await addDoc(likedRef, {
          ...mealData, // Store the entire meal object
          mealType,
          weekId: documentId, // Reference to the week
          dayName: dayName || getDay(selected), // Which day
          createdAt: new Date(),
        });

        const selectedDay = dayName || getDay(selected);
        const weekPlanKeys = Object.keys(data.weekPlan || {});
        const dayKey = weekPlanKeys.find(
          (key) => key.toLowerCase() === selectedDay.toLowerCase()
        );

        if (dayKey && data.weekPlan[dayKey]?.[mealType]) {
          const planRef = doc(
            db,
            "users",
            currentUser.uid,
            "mealPlans",
            documentId
          );
          const updPlan = { ...data.weekPlan };
          updPlan[dayKey] = {
            ...updPlan[dayKey],
            [mealType]: {
              ...updPlan[dayKey][mealType],
              liked: true,
            },
          };
          await setDoc(planRef, { weekPlan: updPlan }, { merge: true });

          setData({ ...data, weekPlan: updPlan });
        }

        setLiked((prev) => new Set(prev).add(mealData.name));
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleClick = (mealType, mealData) => {
    setSelectedMeal({ mealType, mealData });
    setShowChat(false);
  };

  const handleCloseMealDetails = () => {
    setSelectedMeal(null);
    setShowChat(false);
  };

  const handleDislike = () => {
    setShowChat(true);
  };

  const handleDateSelect = (date) => {
    setSelected(date);
    setSelectedMeal(null);
    setShowChat(false);
  };

  const handleMealUpdate = async (updatedMeal) => {
    try {
      const selectedDay = getDay(selected);
      const weekPlanKeys = Object.keys(data.weekPlan);
      const dayKey = weekPlanKeys.find(
        (key) => key.toLowerCase() === selectedDay.toLowerCase()
      );

      if (!dayKey) return;

      const planRef = doc(
        db,
        "users",
        currentUser.uid,
        "mealPlans",
        documentId
      );
      const updatedPlan = { ...data.weekPlan };
      updatedPlan[dayKey] = {
        ...updatedPlan[dayKey],
        [selectedMeal.mealType]: updatedMeal,
      };

      await setDoc(planRef, { weekPlan: updatedPlan }, { merge: true });

      setData({ ...data, weekPlan: updatedPlan });

      setSelectedMeal({
        mealType: selectedMeal.mealType,
        mealData: updatedMeal,
      });
    } catch (err) {
      console.error("Error updating meal:", err);
    }
  };

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
        const docRef = doc(
          db,
          "users",
          currentUser.uid,
          "mealPlans",
          documentId
        );
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

  useEffect(() => {
    if (!data?.weekPlan) {
      setLiked(new Set()); // O(1) on search
      return;
    }

    const fetchLikedMeals = async () => {
      try {
        const likedRef = collection(db, "users", currentUser.uid, "liked");
        const likedSnap = await getDocs(likedRef);
        const likedNames = new Set();

        likedSnap.forEach((doc) => {
          const likedData = doc.data();
          if (likedData.name) {
            likedNames.add(likedData.name);
          }
        });

        setLiked(likedNames);
      } catch (err) {
        console.error("Error fetching liked meals:", err);
      }
    };

    fetchLikedMeals();
  }, [currentUser, data?.weekPlan]);

  return (
    <div className={styles.dashboardContainer}>
      {/* Fixed Julie Chat Overlay */}
      {showChat && selectedMeal && (
        <div className={styles.chatOverlay}>
          <SmallChat
            week={documentId}
            day={getDay(selected).toLowerCase()}
            type={selectedMeal.mealType}
            meal={selectedMeal.mealData}
            onMealUpdate={handleMealUpdate}
          />
        </div>
      )}

      <div className={`${styles.mainDash} ${showChat ? styles.withChat : ""}`}>
        {!showChat && (
          <div className={styles.leftPanel}>
            <DayPicker
              showOutsideDays
              animate
              className={styles.dayPicker}
              mode="single"
              selected={selected}
              onSelect={handleDateSelect}
              required
              showWeekNumber
              ISOWeek
            />
          </div>
        )}

        <div className={styles.rightPanel}>
          {loading && <p>Loading...</p>}
          {error && <p>Error</p>}
          {!loading && !error && (
            <div>
              {!data || !data.weekPlan ? (
                <DailyMealPlan dayName={null} dayMeals={null} />
              ) : (
                (() => {
                  const selectedDay = getDay(selected);
                  const weekPlanKeys = Object.keys(data.weekPlan);
                  const dayKey = weekPlanKeys.find(
                    (key) => key.toLowerCase() === selectedDay.toLowerCase()
                  );

                  const dayMeals = dayKey ? data.weekPlan[dayKey] : null;

                  return (
                    <>
                      {selectedMeal ? (
                        <MealDetails
                          mealType={selectedMeal.mealType}
                          mealData={selectedMeal.mealData}
                          onClose={handleCloseMealDetails}
                          onDislike={handleDislike}
                          onLike={(mealType, mealData) =>
                            handleLike(mealType, mealData, selectedDay)
                          }
                          isLiked={
                            selectedMeal.mealData?.name
                              ? likedMeals.has(selectedMeal.mealData.name)
                              : false
                          }
                        />
                      ) : (
                        <DailyMealPlan
                          dayName={selectedDay}
                          dayMeals={dayMeals}
                          onClick={handleClick}
                        />
                      )}
                    </>
                  );
                })()
              )}
            </div>
          )}
        </div>
      </div>
      {data?.weekPlan && !showChat && (
        <div className={styles.weeklyStats}>
          <WeeklyStats weekPlan={data?.weekPlan} />
        </div>
      )}
    </div>
  );
}

export default Dashboard;
