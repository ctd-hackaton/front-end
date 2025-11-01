import { useState, useRef, useEffect  } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import SignInModal from "../features/SignInModal";
import SignUpModal from "../features/SignUpModal";
import styles from "../css/Header.module.css";
import { useFirestoreDoc } from "../hooks/useFirestoreDoc";
import userIcon from "../assets/user.svg"

function Header() {
  const { currentUser, logout } = useAuth();
  const userId = currentUser?.uid;
  const { data: userDoc, loading, error } = useFirestoreDoc("users", userId);
  const navigate = useNavigate();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
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

  const getAvatar = () => {
    return userDoc?.photoURL || currentUser?.photoURL || userIcon;
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
            <div className={styles.userMenu} ref={menuRef}>
              <img
                src={getAvatar()}
                alt="User"
                className={styles.userIcon}
                onClick={() => setMenuOpen((prev) => !prev)}
              />
              {menuOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    Hello, {getName()}
                  </div>
                  <div
                    className={styles.dropdownItem}
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/userinfo");
                    }}
                  >
                    View Profile
                  </div>
                  <div
                    className={styles.dropdownItem}
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/profile");
                    }}
                  >
                    Change Account Preferences
                  </div>
                  <div className={styles.dropdownItem} onClick={handleLogout}>
                    Logout
                  </div>
                </div>
              )}
            </div>
          </div>
        )  : (
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
