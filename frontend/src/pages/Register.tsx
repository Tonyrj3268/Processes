import React, { useState, useEffect } from "react";
import { Box, Button, Slide, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Register: React.FC = () => {
  const [accountName, setAccountName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (errorMessage) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleRegister = async () => {
    if (!accountName) {
      setErrorMessage("請輸入帳號");
      setShowError(true);
      return;
    }
    if (!userName) {
      setErrorMessage("請輸入用戶名稱");
      setShowError(true);
      return;
    }
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
      const response = await axios.post("/api/auth/register", {
        accountName,
        userName,
        email,
        password,
      });

      if (response.status === 201) {
        alert("註冊成功！");
        navigate("/login");
      }
    } catch (error: any) {
      if (error.response && error.response.data.errors) {
        setErrorMessage(
          error.response.data.errors.map((err: any) => err.msg).join("\n"),
        );
      } else if (error.response && error.response.data.error) {
        setErrorMessage(error.response.data.error);
      } else {
        console.error(error);
        setErrorMessage("註冊過程中發生錯誤，請稍後再試");
      }
    }
  };

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
        sx={{ marginBottom: 2, fontSize: "20px", fontWeight: "bold" }}
      >
        註冊新帳號
      </Typography>

      <TextField
        variant="outlined"
        placeholder="帳號名稱（長度 3 至 20 位）"
        value={accountName}
        onChange={(e) => setAccountName(e.target.value)}
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
        placeholder="使用者名稱（長度 3 至 20 位）"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
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
        placeholder="電子郵件地址"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
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
        placeholder="密碼（長度至少 6 位）"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
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
        onClick={handleRegister}
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
        註冊
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
        onClick={() => navigate("/login")}
      >
        已經有帳號？
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

export default Register;
