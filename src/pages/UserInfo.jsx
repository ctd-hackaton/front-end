import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { doc, updateDoc, getDoc, getFirestore } from "firebase/firestore";
import styles from "../css/UserInfoPage.module.css";

export default function UserInfo() {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;
  const db = getFirestore();

  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    displayName: "",
    name: "",
    email: "",
  });

  // Fetch user data
  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      setLoading(true);
      setError(null);

      try {
        const ref = doc(db, "users", userId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setUserDoc(data);
          setFormData({
            displayName: data.displayName || "",
            name: data.name || "",
            email: data.email || currentUser?.email || "",
          });
        } else {
          setUserDoc(null);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [db, userId, currentUser]);

  // Input handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Validate inputs (English letters only, min 3 chars)
  const validateFields = () => {
    const errors = {};
    const englishOnly = /^[A-Za-z\s-]+$/;

    if (!formData.displayName.trim()) {
      errors.displayName = "Please enter a display name";
    } else if (formData.displayName.trim().length < 3) {
      errors.displayName = "Must be at least 3 letters";
    } else if (!englishOnly.test(formData.displayName)) {
      errors.displayName = "Only English letters allowed";
    }

    if (!formData.name.trim()) {
      errors.name = "Please enter your full name";
    } else if (formData.name.trim().length < 3) {
      errors.name = "Must be at least 3 letters";
    } else if (!englishOnly.test(formData.name)) {
      errors.name = "Only English letters allowed";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Cancel editing
  const handleCancel = () => {
    if (userDoc) {
      setFormData({
        displayName: userDoc.displayName || "",
        name: userDoc.name || "",
        email: userDoc.email || currentUser?.email || "",
      });
    }
    setIsEditing(false);
    setSaveError(null);
    setValidationErrors({});
  };

  // Save updates
  const handleSave = async () => {
    if (!userId) return;
    if (!validateFields()) return;

    setSaving(true);
    setSaveError(null);

    try {
      const ref = doc(db, "users", userId);
      await updateDoc(ref, {
        displayName: formData.displayName.trim(),
        name: formData.name.trim(),
      });

      setUserDoc((prev) => ({
        ...prev,
        displayName: formData.displayName.trim(),
        name: formData.name.trim(),
      }));

      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update user info", err);
      setSaveError("Failed to update info. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.container}>Loading...</div>;
  if (error) return <div className={styles.container}>Error: {error.message}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.headerCard}>
        <h1 className={styles.userName}>
          {formData.displayName || "User"}
        </h1>
        <p className={styles.userSubtitle}>Profile Information</p>
      </div>

      <div className={styles.formCard}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Email</label>
          <input
            type="email"
            value={formData.email}
            readOnly
            className={styles.readonlyInput}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Display Name</label>
          <input
            type="text"
            name="displayName"
            value={formData.displayName}
            onChange={handleInputChange}
            readOnly={!isEditing}
            className={isEditing ? styles.input : styles.readonlyInput}
          />
          {validationErrors.displayName && (
            <p className={styles.errorText}>{validationErrors.displayName}</p>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            readOnly={!isEditing}
            className={isEditing ? styles.input : styles.readonlyInput}
          />
          {validationErrors.name && (
            <p className={styles.errorText}>{validationErrors.name}</p>
          )}
        </div>

        {saveError && <div className={styles.errorText}>{saveError}</div>}

        <div className={styles.actions}>
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className={styles.saveButton}
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={handleCancel} className={styles.cancelButton}>
                Cancel
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className={styles.editButton}>
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
