import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import styles from '../css/home/ShoppingListCard.module.css';

export default function ShoppingListCard({ initialItems, maxVisible = 6 }) {
  const [items, setItems] = useState(initialItems || [
    { id: 1, name: 'Salmon', checked: true },
    { id: 2, name: 'Broccoli', checked: true },
    { id: 3, name: 'Rice', checked: true },
    { id: 4, name: 'Chicken Breast', checked: true },
    { id: 5, name: 'Olive Oil', checked: true },
    { id: 6, name: 'Tomatoes', checked: true },
    { id: 7, name: 'Spinach', checked: true },
    { id: 8, name: 'Eggs', checked: false },
    { id: 9, name: 'Pasta', checked: false },
    { id: 10, name: 'Garlic', checked: false },
  ]);

  const checkedCount = items.filter(item => item.checked).length;
  const totalCount = items.length;
  const progress = (checkedCount / totalCount) * 100;

  const toggleItem = (id) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <ShoppingCart className={styles.icon} size={24} />
          <h2 className={styles.title}>Shopping List</h2>
        </div>
        <span className={styles.count}>{checkedCount}/{totalCount}</span>
      </div>

      <div className={styles.progressBarContainer}>
        <div className={styles.progressBarFill} style={{ width: `${progress}%` }}></div>
      </div>

      <div className={styles.list}>
        {items.slice(0, maxVisible).map(item => (
          <div key={item.id} className={styles.item} onClick={() => toggleItem(item.id)}>
            <div className={`${styles.checkbox} ${item.checked ? styles.checked : ''}`}></div>
            <span className={`${styles.itemName} ${item.checked ? styles.checked : ''}`}>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
