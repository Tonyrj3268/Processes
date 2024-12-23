import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Button,
} from "@mui/material";

interface GuestDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const GuestDialog: React.FC<GuestDialogProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: "20px",
          padding: "16px",
          width: "400px",
        },
      }}
    >
      <DialogTitle>
        <Typography fontSize="30px" fontWeight="bold" textAlign="center">
          註冊即可發佈貼文
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography
          textAlign="center"
          sx={{
            color: "#aaa",
            mb: 2,
            whiteSpace: "pre-line",
            fontSize: "16px",
          }}
        >
          {"加入 Processes 即可分享意見、詢問問題、\n隨興發佈想法和其他內容。"}
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#000",
              color: "#fff",
              textTransform: "none",
              borderRadius: "8px",
              padding: "10px 20px",
              fontSize: "14px",
            }}
            onClick={() => {
              window.location.href = "/login"; // 導向到登入頁
              onClose();
            }}
          >
            使用 Processes 帳號繼續
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default GuestDialog;
