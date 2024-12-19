import React, { useState, useEffect } from "react";
import { Box, Button, Slide, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  const handleLogin = async () => {
    if (!email) {
      setErrorMessage("請輸入電子郵件地址");
      setShowError(true);
      return;
    }
    if (!password) {
      setErrorMessage("請輸入密碼");
      setShowError(true);
      return;
    }
    setErrorMessage(null);
    setShowError(false);

    try {
      const response = await axios.post<{ token: string }>("/api/auth/login", {
        email,
        password,
      });

      if (response.status === 200) {
        alert("登入成功！");
        localStorage.setItem("token", response.data.token);
        navigate("/");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.response && error.response.data.error) {
        setErrorMessage(error.response.data.error);
      } else {
        console.error(error);
        setErrorMessage("登入過程中發生錯誤，請稍後再試");
      }
      setShowError(true);
    }
  };

  useEffect(() => {
    if (errorMessage) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const navigate = useNavigate();

  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fafafa",
        overflow: "hidden",
      }}
    >
      <Typography
        sx={{ marginBottom: 2, fontSize: "22px", fontWeight: "bold" }}
      >
        Processes
      </Typography>

      <TextField
        variant="outlined"
        placeholder="電子郵件地址"
        value={email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setEmail(e.target.value)
        }
        fullWidth
        sx={{
          maxWidth: "380px",
          marginBottom: 1,
          backgroundColor: "#f0f0f0",
          borderRadius: 3,
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              border: "none",
            },
          },
        }}
      />

      <TextField
        variant="outlined"
        placeholder="密碼"
        type="password"
        value={password}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setPassword(e.target.value)
        }
        fullWidth
        sx={{
          maxWidth: "380px",
          marginBottom: 1,
          backgroundColor: "#f0f0f0",
          borderRadius: 3,
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              border: "none",
            },
          },
        }}
      />

      <Button
        variant="contained"
        fullWidth
        onClick={handleLogin}
        sx={{
          maxWidth: "380px",
          backgroundColor: "black",
          color: "white",
          height: "60px",
          borderRadius: 3,
          fontSize: "16px",
          "&:hover": {
            backgroundColor: "#333",
          },
        }}
      >
        登入
      </Button>

      <Typography
        sx={{
          marginTop: 3,
          color: "#9e9e9e",
          cursor: "pointer",
          fontSize: "16px",
          "&:hover": {
            color: "#333",
          },
        }}
        onClick={() => navigate("/register")}
      >
        還沒有帳號？
      </Typography>

      <Slide direction="up" in={showError} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: "fixed",
            bottom: 20,
            maxWidth: "380px",
            padding: 2,
            backgroundColor: "black",
            color: "white",
            borderRadius: "8px",
            alignContent: "center",
            fontSize: "14px",
          }}
        >
          {errorMessage}
        </Box>
      </Slide>
    </Box>
  );
};

export default Login;
