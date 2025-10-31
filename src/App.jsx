import { createBrowserRouter, RouterProvider } from 'react-router';
import { AuthProvider } from './contexts/AuthProvider';
import Header from './shared/Header';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Test from './pages/Test';
import './App.css'

function AppLayout() {
  return (
    <div>
      <Header />
      <Home />
    </div>
  );
}

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <AppLayout />
    },
    {
      path: "/dashboard",
      element: <Dashboard />
    },
    {
      path: "/test",
      element: <Test />
    },
    {
      path: "*",
      element: <div>Not Found</div>
    }
  ]);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App
