import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import SignInModal from "../features/SignInModal";
import SignUpModal from "../features/SignUpModal";
import styles from "../css/Header.module.css";
import { useFirestoreDoc } from "../hooks/useFirestoreDoc";

function Header() {
  const { currentUser, logout } = useAuth();
  const userId = currentUser?.uid;
  const { data: userDoc, loading, error } = useFirestoreDoc("users", userId);
  const navigate = useNavigate();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

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
      <nav>
        {currentUser ? (
          <div className={styles.navLinks}>
            <span>Hello {getName(currentUser)}</span>
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/chat"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              Chat
            </NavLink>
            <button onClick={handleLogout}>Logout</button>
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
