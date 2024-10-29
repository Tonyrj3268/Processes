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

const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
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
    </Box>
  );
};

export default Sidebar;
