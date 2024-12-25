import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Activity from "./pages/Activity";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Replies from "./pages/Replies";
import Reposts from "./pages/Reposts";
import Posts from "./pages/Posts";
import { useUser } from "./contexts/UserContext";
import CircularProgress from "@mui/material/CircularProgress";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoading } = useUser();

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </div>
    );
  }

  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
    handle: { title: "Log in" },
  },
  {
    path: "/register",
    element: <Register />,
    handle: { title: "Register" },
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Home />, handle: { title: "首頁" } },
      {
        path: "/search",
        element: (
          <ProtectedRoute>
            <Search />
          </ProtectedRoute>
        ),
        handle: { title: "搜尋" },
      },
      {
        path: "/activity",
        element: (
          <ProtectedRoute>
            <Activity />
          </ProtectedRoute>
        ),
        handle: { title: "動態" },
      },
      {
        path: "/profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
        handle: { title: "個人檔案" },
        children: [
          {
            index: true,
            element: <Posts />,
          },
          {
            path: "replies",
            element: <Replies />,
          },
          {
            path: "reposts",
            element: <Reposts />,
          },
        ],
      },
    ],
  },
]);

const AppRoutes: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRoutes;
