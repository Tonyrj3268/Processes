import React, { useState } from "react";
import { Box, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import {
  HomeOutlined,
  SearchOutlined,
  Add,
  FavoriteBorder,
  PersonOutlined,
  PushPinOutlined,
  MoreHoriz,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import PostDialog from "../components/PostDialog";
import GuestDialog from "../components/GuestDialog";
import usePostHandler from "../hooks/usePostHandler";
import { useUser } from "../contexts/UserContext";

interface SidebarProps {
  userData: {
    accountName: string;
    avatarUrl: string;
  } | null;
}

const Sidebar: React.FC<SidebarProps> = () => {
  const { isGuest } = useUser();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isGuestDialogOpen, setGuestDialogOpen] = useState(false); //

  const { dialogOpen, handleOpenDialog, handleCloseDialog, handleSubmit } =
    usePostHandler();

  const handleNavigate = (path: string, requireAuth = false) => {
    if (requireAuth && isGuest) {
      setGuestDialogOpen(true);
      return;
    }

    if (path === "") {
      handleOpenDialog();
    } else {
      navigate(path);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    handleMenuClose();
  };

  return (
    <Box
      sx={{
        position: "fixed",
        left: 0,
        top: "64px",
        width: "70px",
        height: "calc(100vh - 64px)",
        backgroundColor: "#fbfbfb",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "80px",
        justifyContent: "space-around",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          alignItems: "center",
        }}
      >
        {[
          { Icon: HomeOutlined, path: "/", requireAuth: false },
          { Icon: SearchOutlined, path: "/search", requireAuth: false },
          { Icon: Add, path: "", requireAuth: true }, // Dialog
          { Icon: FavoriteBorder, path: "/activity", requireAuth: true },
          { Icon: PersonOutlined, path: "/profile", requireAuth: true },
        ].map(({ Icon, path, requireAuth }, index) => (
          <IconButton
            key={index}
            onClick={() => handleNavigate(path, requireAuth)}
            sx={{
              borderRadius: "16px",
              padding: "10px",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.08)",
              },
            }}
          >
            <Icon sx={{ color: "#9e9e9e", fontSize: "30px" }} />{" "}
          </IconButton>
        ))}
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        {[PushPinOutlined, MoreHoriz].map((Icon, index) => (
          <IconButton
            key={index}
            onClick={index === 1 ? handleMenuOpen : undefined}
            sx={{
              borderRadius: "16px",
              padding: "10px",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.08)",
              },
            }}
          >
            <Icon sx={{ color: "#9e9e9e", fontSize: "30px" }} />
          </IconButton>
        ))}
      </Box>

      {!isGuest && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: { width: 150, borderRadius: "10px" },
          }}
        >
          <MenuItem onClick={handleLogout}>
            <Typography color="error">登出</Typography>
          </MenuItem>
        </Menu>
      )}

      {/* PostDialog */}
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
  );
};

export default Sidebar;
