import { useState, useRef, useEffect  } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import SignInModal from "../features/SignInModal";
import SignUpModal from "../features/SignUpModal";
import styles from "../css/Header.module.css";
import { useFirestoreDoc } from "../hooks/useFirestoreDoc";
import { ChefHat, User } from 'lucide-react';

function Header() {
  const { currentUser, logout } = useAuth();
  const userId = currentUser?.uid;
  const { data: userDoc, loading, error } = useFirestoreDoc("users", userId);
  const navigate = useNavigate();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
        {currentUser && (
            <div className={styles.headerCenter}>
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    isActive ? `${styles.navLink} ${styles.navLinkActiveHome}` : styles.navLink
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
