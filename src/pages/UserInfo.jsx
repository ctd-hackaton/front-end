import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useFirestoreDoc } from "../hooks/useFirestoreDoc";
import { doc, updateDoc, getFirestore } from "firebase/firestore";
import styles from "../css/UserInfoPage.module.css";

export default function UserInfo() {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;

  const { data: userDoc, loading, error, setData } = useFirestoreDoc("users", userId);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    name: "",
    email: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (userDoc) {
      setFormData({
        displayName: userDoc.displayName || "",
        name: userDoc.name || "",
        email: currentUser?.email || userDoc.email || "",
      });
    }
  }, [userDoc, currentUser?.email]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    if (userDoc) {
      setFormData({
        displayName: userDoc.displayName || "",
        name: userDoc.name || "",
        email: currentUser?.email || userDoc.email || "",
      });
    }
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    setSaveError(null);

    try {
      const db = getFirestore();
      const userRef = doc(db, "users", userId);

      await updateDoc(userRef, {
        displayName: formData.displayName.trim(),
        name: formData.name.trim(),
      });

      setData((prev) => ({
        ...prev,
        displayName: formData.displayName.trim(),
        name: formData.name.trim(),
      }));

      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update user info", err);
      setSaveError("Failed to update user info. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.container}>loading...</div>;
  if (error) return <div className={styles.container}>Error: {error.message}</div>;
  

  return (
    <div className={styles.container}>
      <h1>User info</h1>

      <div className={styles.formGroup}>
        <label>Email</label>
        <input
          type="email"
          value={formData.email}
          readOnly
          className={styles.readonlyInput}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Display name</label>
        {isEditing ? (
          <input
            type="text"
            name="displayName"
            value={formData.displayName}
            onChange={handleInputChange}
            className={styles.input}
          />
        ) : (
          <div className={styles.value}>{formData.displayName || "— unknown —"}</div>
        )}
      </div>

      <div className={styles.formGroup}>
        <label>Full name</label>
        {isEditing ? (
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={styles.input}
          />
        ) : (
          <div className={styles.value}>{formData.name || "— unknown —"}</div>
        )}
      </div>

      {saveError && <div className={styles.error}>{saveError}</div>}

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
  );
}