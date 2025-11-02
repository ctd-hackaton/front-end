import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { db, functions } from "../utils/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import SignInModal from "../features/SignInModal";
import SignUpModal from "../features/SignUpModal";
import styles from "../css/Header.module.css";
import { useFirestoreDoc } from "../hooks/useFirestoreDoc";
import { ChefHat, User } from "lucide-react";

function Header() {
  const { currentUser, logout } = useAuth();
  const userId = currentUser?.uid;
  const { data: userDoc, loading, error } = useFirestoreDoc("users", userId);
  const navigate = useNavigate();
  const location = useLocation();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [recipeStatus, setRecipeStatus] = useState(null);
  const [currentWeekId, setCurrentWeekId] = useState(null);

  // Get weekId from location state or dashboard
  useEffect(() => {
    if (location.state?.weekId) {
      setCurrentWeekId(location.state.weekId);
    }
  }, [location]);

  // Listen to recipe generation status
  useEffect(() => {
    if (!currentUser || !currentWeekId) {
      setRecipeStatus(null);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, `users/${currentUser.uid}/mealPlans/${currentWeekId}`),
      (doc) => {
        const status = doc.data()?.recipeGenerationStatus;
        setRecipeStatus(status);

        // Clear weekId and status when generation is complete
        if (status?.completedAt && !status?.isGenerating) {
          setTimeout(() => {
            setCurrentWeekId(null);
            setRecipeStatus(null);
          }, 3000); // Show completion message for 3 seconds
        }
      }
    );

    return () => unsubscribe();
  }, [currentUser, currentWeekId]);

  const handleCancelRecipes = async () => {
    if (!currentWeekId) return;

    try {
      const cancelRecipeGeneration = httpsCallable(
        functions,
        "cancelRecipeGeneration"
      );
      await cancelRecipeGeneration({ weekId: currentWeekId });
    } catch (error) {
      console.error("Failed to cancel recipe generation:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const getName = () => {
    if (loading) return "Loading...";
    if (error) return "Error";
    if (userDoc?.displayName) return userDoc.displayName;
    if (currentUser?.displayName) return currentUser.displayName;
    if (currentUser?.email) return currentUser.email;
    return "User";
  };

  return (
    <header className={styles.mainHeader}>
      <a href="/" className={styles.headerLogo}>
        <ChefHat className={styles.headerLogoIcon} size={28} />
        <h1 className={styles.headerLogoText}>Chef Jul</h1>
      </a>

      <div className={styles.headerCenter}>
        <div className={styles.recipeStatusContainer}>
          {recipeStatus?.isGenerating && (
            <div className={styles.recipeProgressInline}>
              <span className={styles.progressText}>
                📖 Generating recipes... {recipeStatus.progress}/
                {recipeStatus.total}
              </span>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${
                      (recipeStatus.progress / recipeStatus.total) * 100
                    }%`,
                  }}
                />
              </div>
              <button
                className={styles.cancelButton}
                onClick={handleCancelRecipes}
              >
                ✕
              </button>
            </div>
          )}
          {recipeStatus?.completedAt &&
            !recipeStatus?.isGenerating &&
            location.state?.generatingRecipes && (
              <div className={styles.recipeCompleteInline}>
                ✅ Recipes ready!
              </div>
            )}
        </div>
        {currentUser && (
          <div className={styles.headerNavLinks}>
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive
                  ? `${styles.navLink} ${styles.navLinkActiveHome}`
                  : styles.navLink
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              Dashboard
            </NavLink>
          </div>
        )}
      </div>
      <nav className={styles.headerRight}>
        {currentUser ? (
          <div className={styles.headerProfile} ref={dropdownRef}>
            <span className={styles.navText}>Hello, {getName()}</span>

            <button
              className={styles.profileButton}
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              <User size={32} strokeWidth={1.5} color="white" />
            </button>
            {dropdownOpen && (
              <div
                className={`${styles.profileDropdown} ${
                  dropdownOpen ? styles.open : ""
                }`}
              >
                <div
                  className={styles.dropdownItem}
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate("/userinfo");
                  }}
                >
                  Profile
                </div>

                <div
                  className={styles.dropdownItem}
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate("/profile");
                  }}
                >
                  Preferences
                </div>

                <div className={styles.dropdownItem} onClick={handleLogout}>
                  Logout
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <button onClick={() => setShowSignIn(true)}>Sign In</button>
            <button onClick={() => setShowSignUp(true)}>Sign Up</button>
          </div>
        )}
      </nav>

      {showSignIn && (
        <SignInModal
          onClose={() => setShowSignIn(false)}
          onSwitchToSignUp={() => {
            setShowSignIn(false);
            setShowSignUp(true);
          }}
        />
      )}

      {showSignUp && (
        <SignUpModal
          onClose={() => setShowSignUp(false)}
          onSwitchToSignIn={() => {
            setShowSignUp(false);
            setShowSignIn(true);
          }}
        />
      )}
    </header>
  );
}

export default Header;
