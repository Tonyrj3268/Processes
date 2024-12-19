// layouts/MainLayout.tsx
import React, { useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { Box, Fab } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Outlet, useMatches } from "react-router-dom";
import PostDialog from "../components/PostDialog";
import usePostHandler from "../hooks/usePostHandler";
import { useUser } from '../contexts/UserContext';

interface RouteHandle {
  title?: string;
}

const MainLayout: React.FC = () => {
  const matches = useMatches();
  const { userData } = useUser();

  const { dialogOpen, handleOpenDialog, handleCloseDialog, handleSubmit } =
    usePostHandler();

  // 處理頁面標題
  useEffect(() => {
    const currentMatch = matches.find(
      (match) => (match.handle as RouteHandle)?.title,
    );
    if (currentMatch && currentMatch.handle) {
      document.title =
        (currentMatch.handle as RouteHandle).title || "Processes";
    }
  }, [matches]);

  const currentMatch = matches.find(
    (match) => (match.handle as RouteHandle)?.title,
  );
  const pageTitle =
    currentMatch && (currentMatch.handle as RouteHandle)?.title
      ? (currentMatch.handle as RouteHandle).title
      : "Processes";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Header title={pageTitle || "Processes"} />
      <Box sx={{ display: "flex", flex: 1 }}>
        <Sidebar userData={userData} />
        <Box
          component="main"
          sx={{ flex: 1, paddingTop: "64px", overflowY: "auto" }}
        >
          <Outlet context={userData} />
          <Fab
            aria-label="add"
            onClick={handleOpenDialog}
            sx={{
              position: "fixed",
              bottom: 30,
              right: 30,
              backgroundColor: "#fff",
              color: "#000",
              borderRadius: "12px",
              width: "75px",
              height: "65px",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
              "&:hover": {
                backgroundColor: "#f5f5f5",
              },
            }}
          >
            <AddIcon sx={{ fontSize: "36px", fontWeight: "bold" }} />
          </Fab>
          <PostDialog
            open={dialogOpen}
            onClose={handleCloseDialog}
            onSubmit={handleSubmit}
            accountName={userData?.accountName || "Default User"}
            avatarUrl={userData?.avatarUrl || "/default_avatar.jpg"}
            title="新串文"
          />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;