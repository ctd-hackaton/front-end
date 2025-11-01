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
        { index: true, element: <Home /> },
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
          path: "smallChat",
          element: (
            <ProtectedRoute>
              <SmallChat />
            </ProtectedRoute>
          ),
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
