import { AppBar, Button, IconButton, Toolbar, Typography } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate("/");
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <AppBar
      position="static"
      sx={{
        background: "#fbfbfb",
        boxShadow: "none",
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-evenly",
          alignItems: "center",
        }}
      >
        <IconButton edge="start" aria-label="menu" onClick={handleLogoClick}>
          <img
            src="/favicon.jpg"
            alt="logo"
            style={{ width: "30px", height: "30px" }}
          />
        </IconButton>
        <Typography
          component="div"
          sx={{
            flexGrow: 1,
            color: "black",
            fontSize: "16px",
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          {title}
        </Typography>
        <Button
          variant="contained"
          sx={{ backgroundColor: "black", borderRadius: 3 }}
          onClick={handleLoginClick}
        >
          登入
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
