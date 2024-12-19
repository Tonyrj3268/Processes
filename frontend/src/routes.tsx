// routes.tsx
import React from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
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

// 保護路由組件
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // const { userData, isLoading } = useUser();
  // const token = localStorage.getItem('token');

  // 沒有 token 強制拉回登入頁面 (會影響首頁 guest，先註解掉)
  // if (!token && !isLoading) {
  //   return <Navigate to="/login" replace />;
  // }

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
        element: <Search />,
        handle: { title: "搜尋" },
      },
      {
        path: "/activity",
        element: <Activity />,
        handle: { title: "動態" },
      },
      {
        path: "/profile",
        element: <Profile />,
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
