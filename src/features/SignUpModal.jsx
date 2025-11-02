import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useAuth } from "../hooks/useAuth";
import GoogleIcon from "../assets/google-icon.svg";
import styles from "../css/Modal.module.css";
import { useNavigate } from "react-router";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../utils/firebase";
import { EyeOpenIcon, EyeNoneIcon } from "@radix-ui/react-icons";
import * as Toggle from "@radix-ui/react-toggle";

export default function SignUpModal({ onClose, onSwitchToSignIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup, signInWithGoogle } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      return setError("Please fill in all fields");
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    if (password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    try {
      setError("");
      setLoading(true);
      //CREATE USER IN FIREBASE AUTH
      const userCredential = await signup(email, password);
      const user = userCredential.user;
      // CREATE USER DOCUMENT IN FIRESTORE
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        displayName: displayName.trim() || user.email.split("@")[0] || "User",
        createdAt: serverTimestamp(),
        personalData: {
          age: null,
          weightKg: null,
          heightCm: null,
          activityLevel: "moderate",
        },
        preferences: {
          dietType: "none",
          favoriteCuisine: [],
          excludedIngredientRefs: [],
          allergyIngredientRefs: [],
        },
        goals: {
          dailyCalorieTarget: 2000,
          proteinGoalGrams: 150,
          carbsGoalGrams: 200,
          fatsGoalGrams: 65,
        },
      });

      onClose();
      navigate("/profile");
    } catch (error) {
      setError("Failed to create account. Email may already be in use.");
      console.error("Sign up error:", error);
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      setError("");
      setLoading(true);
      const userCredential = await signInWithGoogle();
      const user = userCredential.user;
      //CHECK IF USER DOCUMENT EXISTS, CREATE IF NOT
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        // First time Google sign-in - create user document
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName || user.email.split("@")[0] || "User",
          createdAt: serverTimestamp(),
          personalData: {
            age: null,
            weightKg: null,
            heightCm: null,
            activityLevel: "moderate",
          },
          preferences: {
            dietType: "none",
            favoriteCuisine: [],
            excludedIngredientRefs: [],
            allergyIngredientRefs: [],
          },
          goals: {
            dailyCalorieTarget: 2000,
            proteinGoalGrams: 150,
            carbsGoalGrams: 200,
            fatsGoalGrams: 65,
          },
        });
        onClose();
        navigate("/profile"); // New user - go to profile setup
      } else {
        onClose();
        navigate("/dashboard"); // Existing user - go to dashboard
      }
    } catch (error) {
      setError("Failed to sign in with Google. Please try again.");
      console.error("Google sign in error:", error);
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
          <Dialog.Title className={styles.modalTitle}>Sign Up</Dialog.Title>
          <Dialog.Close asChild>
            <button className={styles.closeButton}>×</button>
          </Dialog.Close>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Name (optional)</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={styles.formInput}
                placeholder="Your name"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.formInput}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.formInput}
                  required
                />
                <Toggle.Root
                  pressed={showPassword}
                  onPressedChange={setShowPassword}
                  className={styles.eyeButton}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeNoneIcon /> : <EyeOpenIcon />}
                </Toggle.Root>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Confirm Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={styles.formInput}
                  required
                />
                <Toggle.Root
                  pressed={showConfirmPassword}
                  onPressedChange={setShowConfirmPassword}
                  className={styles.eyeButton}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeNoneIcon /> : <EyeOpenIcon />}
                </Toggle.Root>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`${styles.submitButton} ${styles.submitButtonSuccess}`}
            >
              {loading ? "Creating Account..." : "Sign Up"}
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
            {loading ? "Signing In..." : "Continue with Google"}
          </button>

          <div className={styles.switchText}>
            <span style={{ color: "#666" }}>Already have an account? </span>
            <button onClick={onSwitchToSignIn} className={styles.switchButton}>
              Sign in
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
