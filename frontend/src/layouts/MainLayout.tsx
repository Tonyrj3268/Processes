import React, { useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { Box } from "@mui/material";
import { Outlet, useMatches } from "react-router-dom";

interface RouteHandle {
  title?: string;
}

const MainLayout: React.FC = () => {
  const matches = useMatches();

  useEffect(() => {
    const currentMatch = matches.find(
      (match) => (match.handle as RouteHandle)?.title
    );
    if (currentMatch && currentMatch.handle) {
      document.title =
        (currentMatch.handle as RouteHandle).title || "Processes";
    }
  }, [matches]);

  const currentMatch = matches.find(
    (match) => (match.handle as RouteHandle)?.title
  );
  const pageTitle =
    currentMatch && (currentMatch.handle as RouteHandle)?.title
      ? (currentMatch.handle as RouteHandle).title
      : "Processes";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Header title={pageTitle || "Processes"} />
      <Box sx={{ display: "flex", flex: 1 }}>
        <Sidebar />
        <Box component="main" sx={{ flex: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
