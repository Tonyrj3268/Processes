import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { Box, Fab } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Outlet, useMatches } from "react-router-dom";
import PostDialog from "../components/PostDialog";
import GuestDialog from "../components/GuestDialog";
import usePostHandler from "../hooks/usePostHandler";
import { useUser } from "../contexts/UserContext";

interface RouteHandle {
  title?: string;
}

const MainLayout: React.FC = () => {
  const matches = useMatches();
  const { userData, isGuest } = useUser();
  const [isGuestDialogOpen, setGuestDialogOpen] = useState(false);

  const { dialogOpen, handleOpenDialog, handleCloseDialog, handleSubmit } =
    usePostHandler();

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

  const handleFabClick = () => {
    if (isGuest) {
      setGuestDialogOpen(true);
    } else {
      handleOpenDialog();
    }
  };

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
            onClick={handleFabClick}
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
            <AddIcon
              sx={{
                fontSize: "36px",
                fontWeight: "bold",
              }}
            />
          </Fab>
          <PostDialog
            open={dialogOpen}
            onClose={handleCloseDialog}
            onSubmit={handleSubmit}
            initialContent=""
            initialImages={[]}
            title="新串文"
          />
          <GuestDialog
            isOpen={isGuestDialogOpen}
            onClose={() => setGuestDialogOpen(false)}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
