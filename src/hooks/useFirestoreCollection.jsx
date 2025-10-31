import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../utils/firebase';

export function useFirestoreCollection(collectionPath, options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!collectionPath) {
      setLoading(false);
      return;
    }

    const collectionRef = collection(db, collectionPath);

    let q = collectionRef;
    
    if (options.orderByField) {
      const direction = options.orderDirection || 'asc';
      q = query(collectionRef, orderBy(options.orderByField, direction));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setData(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching collection:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionPath, options.orderByField, options.orderDirection]);

  return { data, loading, error };
}