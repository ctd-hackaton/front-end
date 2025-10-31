import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import Header from '../shared/Header';

function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const querySnapshot = await getDocs(collection(db, 'test'));
        const documents = [];
        querySnapshot.forEach((doc) => {
          documents.push({
            id: doc.id,
            name: doc.data().name || '',
            color: doc.data().color || '',
          });
        });
        setData(documents);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <Header />
      <div>
        <h1>Dashboard</h1>
      </div>

      <div>
        <h2>DB Test collection</h2>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!loading && !error && (
          <div>
            {data.length === 0 ? (
              <p>No data found in test collection</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {data.map((doc) => (
                  <div key={doc.id}>
                    <div>
                      <strong>Document ID:</strong> {doc.id}
                    </div>
                    <div>
                      <strong>Name:</strong> {doc.name || 'N/A'}
                    </div>
                    <div>
                      <strong>Color:</strong> {doc.color || 'N/A'}
                    </div>
                  </div>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default Dashboard
