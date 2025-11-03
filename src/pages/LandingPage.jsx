import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Welcome from "./Welcome";

function LandingPage() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect authenticated users to home
    if (!loading && currentUser) {
      navigate("/home");
    }
  }, [currentUser, loading, navigate]);

  // Show nothing while checking auth
  if (loading) {
    return null;
  }

  // Show welcome page for unauthenticated users
  return <Welcome />;
}

export default LandingPage;
