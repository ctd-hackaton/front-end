import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthProvider";
import Header from "./shared/Header";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import { chatLoader } from "./loaders/chatLoader";
import "./App.css";
import SmallChat from "./pages/SmallChat";
import Userinfo from "./pages/Userinfo";
import Statistics from "./pages/Statistics";
import LandingPage from "./pages/LandingPage";

function AppLayout() {
  return (
    <div>
      <Header />
      <Outlet />
    </div>
  );
}

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <AppLayout />,
      children: [
        { index: true, element: <LandingPage /> },
        {
          path: "home",
          element: (
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          ),
        },
        {
          path: "dashboard",
          element: (
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          ),
        },
        {
          path: "chat",
          element: (
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          ),
          loader: chatLoader,
        },
        {
          path: "/profile",
          element: (
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          ),
        },
        {
          path: "userinfo",
          element: (
            <ProtectedRoute>
              <Userinfo />
            </ProtectedRoute>
          ),
        },
        {
          path: "statistics",
          element: (
            <ProtectedRoute>
              <Statistics />
            </ProtectedRoute>
          ),
        },
        { path: "*", element: <div>Not Found</div> },
      ],
    },
  ]);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
