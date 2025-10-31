import { useFirestoreDoc } from '../hooks/useFirestoreDoc';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function Profile() {
  const { currentUser } = useContext(AuthContext);
  const { data: userProfile, loading, error } = useFirestoreDoc('users', currentUser?.uid);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!userProfile) return <p>No user profile found.</p>;

  return (
    <div style={{ padding: '40px' }}>
      <h1>Welcome, {userProfile.displayName || currentUser.email}</h1>
      <p>Email: {userProfile.email}</p>
    </div>
  );
}
