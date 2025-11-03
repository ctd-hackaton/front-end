import { ShoppingCart, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import { useAuth } from "../hooks/useAuth";
import { getISOWeekYear, getISOWeek } from "date-fns";
import styles from "../css/home/ShoppingListCard.module.css";

export default function ShoppingListCard({ initialItems }) {
  const { currentUser } = useAuth();
  const [items, setItems] = useState(
    initialItems || [
      { id: 1, name: "Salmon", checked: true, category: "Protein" },
      { id: 2, name: "Broccoli", checked: true, category: "Vegetables" },
      { id: 3, name: "Rice", checked: true, category: "Grains" },
      { id: 4, name: "Chicken Breast", checked: true, category: "Protein" },
      { id: 5, name: "Olive Oil", checked: true, category: "Oils" },
      { id: 6, name: "Tomatoes", checked: true, category: "Vegetables" },
      { id: 7, name: "Spinach", checked: true, category: "Vegetables" },
      { id: 8, name: "Eggs", checked: false, category: "Protein" },
      { id: 9, name: "Pasta", checked: false, category: "Grains" },
      { id: 10, name: "Garlic", checked: false, category: "Vegetables" },
    ]
  );

  const [collapsedCategories, setCollapsedCategories] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef(null);

  const weekId = `${getISOWeekYear(new Date())}-W${getISOWeek(new Date())}`;

  // Load checked state from Firestore
  useEffect(() => {
    if (!currentUser || !initialItems) return;

    const loadCheckedState = async () => {
      try {
        const shoppingListRef = doc(
          db,
          "users",
          currentUser.uid,
          "shoppingLists",
          weekId
        );
        const docSnap = await getDoc(shoppingListRef);

        if (docSnap.exists()) {
          const checkedItems = docSnap.data().items || {};

          // Merge checked state with initialItems
          const updatedItems = initialItems.map((item) => ({
            ...item,
            checked: checkedItems[item.name] || false,
          }));

          setItems(updatedItems);
        } else {
          setItems(initialItems);
        }
      } catch (err) {
        console.error("Error loading shopping list:", err);
        setItems(initialItems);
      } finally {
        setIsLoading(false);
      }
    };

    loadCheckedState();
  }, [currentUser, initialItems, weekId]);

  // Save checked state to Firestore (debounced)
  const saveCheckedState = async (updatedItems) => {
    if (!currentUser) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout to batch updates
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const checkedItems = {};
        updatedItems.forEach((item) => {
          checkedItems[item.name] = item.checked;
        });

        const shoppingListRef = doc(
          db,
          "users",
          currentUser.uid,
          "shoppingLists",
          weekId
        );

        await setDoc(shoppingListRef, {
          items: checkedItems,
          weekId: weekId,
          updatedAt: new Date(),
        });
      } catch (err) {
        console.error("Error saving shopping list:", err);
      }
    }, 500); // Wait 500ms before saving
  };

  const checkedCount = items.filter((item) => item.checked).length;
  const totalCount = items.length;
  const progress = (checkedCount / totalCount) * 100;

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups = {};
    items.forEach((item) => {
      const category = item.category || "Other";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });
    return groups;
  }, [items]);

  const toggleItem = (id) => {
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setItems(updatedItems);
    saveCheckedState(updatedItems);
  };

  const toggleCategory = (category) => {
    setCollapsedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <ShoppingCart className={styles.icon} size={24} />
          <h2 className={styles.title}>Shopping List</h2>
        </div>
        <span className={styles.count}>
          {checkedCount}/{totalCount}
        </span>
      </div>

      <div className={styles.progressBarContainer}>
        <div
          className={styles.progressBarFill}
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {isLoading ? (
        <div className={styles.loading}>Loading...</div>
      ) : items.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyMessage}>No items in your shopping list</p>
          <p className={styles.emptyHint}>
            Create a meal plan to generate your shopping list
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {Object.entries(groupedItems).map(([category, categoryItems]) => {
            const isCollapsed = collapsedCategories.has(category);
            return (
              <div key={category} className={styles.categoryGroup}>
                <div
                  className={styles.categoryHeader}
                  onClick={() => toggleCategory(category)}
                >
                  {isCollapsed ? (
                    <ChevronRight size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                  <span>{category}</span>
                  <span className={styles.categoryCount}>
                    ({categoryItems.length})
                  </span>
                </div>
                {!isCollapsed &&
                  categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className={styles.item}
                      onClick={() => toggleItem(item.id)}
                    >
                      <div
                        className={`${styles.checkbox} ${
                          item.checked ? styles.checked : ""
                        }`}
                      ></div>
                      <span
                        className={`${styles.itemName} ${
                          item.checked ? styles.checked : ""
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
