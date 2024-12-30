import {
  AppBar,
  Button,
  IconButton,
  Toolbar,
  Typography,
  Box,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useLocation } from "react-router-dom";

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogoClick = () => {
    navigate("/");
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  const handleBackClick = () => {
    navigate(-1); // 返回上一頁
  };

  const showBackButton = location.pathname.startsWith("/posts/");

  return (
    <AppBar
      position="fixed"
      sx={{
        background: "#fbfbfb",
        boxShadow: "none",
        zIndex: 1300,
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* 左側區域 - Logo */}
        <Box
          sx={{
            minWidth: "80px",
            display: "flex",
            justifyContent: "flex-start",
          }}
        >
          <IconButton edge="start" aria-label="menu" onClick={handleLogoClick}>
            <img
              src="/favicon.jpg"
              alt="logo"
              style={{ width: "30px", height: "30px" }}
            />
          </IconButton>
        </Box>

        {/* 中間區域 - 標題 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            flexGrow: 1,
          }}
        >
          {showBackButton && (
            <IconButton
              edge="start"
              onClick={handleBackClick}
              aria-label="back"
              sx={{
                position: "absolute",
                left: "330px",
                color: "black",
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography
            component="div"
            sx={{
              textAlign: "center",
              color: "black",
              fontSize: "16px",
              fontWeight: "600",
              flexGrow: 1,
            }}
          >
            {title}
          </Typography>
        </Box>

        {/* 右側區域 - 登入按鈕 */}
        <Box
          sx={{ minWidth: "80px", display: "flex", justifyContent: "flex-end" }}
        >
          {!isLoggedIn && (
            <Button
              variant="contained"
              sx={{
                backgroundColor: "black",
                borderRadius: 3,
                textTransform: "none",
              }}
              onClick={handleLoginClick}
            >
              登入
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
