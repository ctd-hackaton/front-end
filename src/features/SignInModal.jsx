import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuth } from '../hooks/useAuth';
import GoogleIcon from '../assets/google-icon.svg';
import styles from '../css/Modal.module.css';
import { useNavigate } from 'react-router';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'; 
import { db } from '../utils/firebase';

export default function SignInModal({ onClose, onSwitchToSignUp }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      return setError('Please fill in all fields');
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      onClose();
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to sign in. Please check your credentials.');
      console.error('Sign in error:', error);
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      const userCredential = await signInWithGoogle();
      const user = userCredential.user;

      //CHECK IF USER DOCUMENT EXISTS IN FIRESTORE
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // First time Google sign-in - create user document
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0] || 'User',
          createdAt: serverTimestamp(),
          personalData: {
            age: null,
            weightKg: null,
            heightCm: null,
            activityLevel: 'moderate'
          },
          preferences: {
            dietType: 'none',
            favoriteCuisine: [],
            excludedIngredientRefs: [],
            allergyIngredientRefs: []
          },
          goals: {
            dailyCalorieTarget: 2000,
            proteinGoalGrams: 150,
            carbsGoalGrams: 200,
            fatsGoalGrams: 65
          }
        });

        onClose();
        navigate('/profile'); // New user - complete profile
      } else {
        onClose();
        navigate('/dashboard'); // Existing user - go to dashboard
      }
    } catch (error) {
      setError('Failed to sign in with Google. Please try again.');
      console.error('Google sign in error:', error);
    }
    setLoading(false);
  };

  return (
    <Dialog.Root open={true} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.modalOverlay} />
        <Dialog.Content 
          className={styles.modalContent}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Dialog.Title className={styles.modalTitle}>Sign In</Dialog.Title>
          <Dialog.Close asChild>
            <button className={styles.closeButton}>
              ×
            </button>
          </Dialog.Close>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.formInput}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.formInput}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`${styles.submitButton} ${styles.submitButtonPrimary}`}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.divider}>
          <div className={styles.dividerLine}></div>
          <span className={styles.dividerText}>OR</span>
          <div className={styles.dividerLine}></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className={styles.googleButton}
        >
          <img src={GoogleIcon} alt="Google" className={styles.googleIcon} />
          {loading ? 'Signing In...' : 'Continue with Google'}
        </button>

        <div className={styles.switchText}>
          <span style={{ color: '#666' }}>Don't have an account? </span>
          <button
            onClick={onSwitchToSignUp}
            className={styles.switchButton}
          >
            Sign up
          </button>
        </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
