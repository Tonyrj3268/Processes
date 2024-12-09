import React from "react";
import { Box, IconButton } from "@mui/material";
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
import usePostHandler from "../hooks/usePostHandler";

interface SidebarProps {
  userData: {
    accountName: string;
    avatarUrl: string;
  } | null;
}

const Sidebar: React.FC<SidebarProps> = ({ userData }) => {
  const navigate = useNavigate();
  const { dialogOpen, handleOpenDialog, handleCloseDialog, handleSubmit } =
    usePostHandler();

  const handleNavigate = (path: string) => {
    if (path === "") {
      // 使用 usePostHandler 打開對話框
      handleOpenDialog();
    } else {
      navigate(path);
    }
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
          { Icon: HomeOutlined, path: "/" },
          { Icon: SearchOutlined, path: "/search" },
          { Icon: Add, path: "" }, // Dialog
          { Icon: FavoriteBorder, path: "/activity" },
          { Icon: PersonOutlined, path: "/profile" },
        ].map(({ Icon, path }, index) => (
          <IconButton
            key={index}
            onClick={() => handleNavigate(path)}
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

      {/* PostDialog */}
      <PostDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        accountName={userData?.accountName || "Default User"}
        avatarUrl={userData?.avatarUrl || "/default_avatar.jpg"}
      />
    </Box>
  );
};

export default Sidebar;
