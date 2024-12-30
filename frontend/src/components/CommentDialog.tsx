import React, { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import { useUser } from "../contexts/UserContext";

interface CommentDialogProps {
  open: boolean;
  onClose: () => void;
  // eslint-disable-next-line no-unused-vars
  onSubmit: (content: string) => Promise<void>;
  originalPost?: {
    content: string;
    user: {
      accountName: string;
      avatarUrl: string;
    };
  };
  initialContent?: string;
  title?: string;
}

const CommentDialog: React.FC<CommentDialogProps> = ({
  open,
  onClose,
  onSubmit,
  originalPost,
  initialContent = "",
  title = "回覆",
}) => {
  const { userData } = useUser();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setContent(initialContent || "");
    }
  }, [open, initialContent]);

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert("請輸入留言");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(content.trim());
      setContent("");
      onClose();
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: "20px",
          padding: "16px",
        },
      }}
    >
      <Box sx={{ padding: "8px" }}>
        <Typography
          sx={{
            fontWeight: "bold",
            fontSize: "16px",
            textAlign: "center",
            marginBottom: "16px",
          }}
        >
          {title}
        </Typography>
        <Divider sx={{ marginBottom: "16px" }} />

        {originalPost && (
          <Box>
            {/* 原貼文內容 */}
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
                marginBottom: "8px",
              }}
            >
              <Avatar
                src={originalPost.user.avatarUrl || "default_avatar.jpg"}
                alt={`${originalPost.user.accountName}'s Avatar`}
                sx={{ width: 40, height: 40 }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Typography sx={{ fontWeight: "bold" }}>
                  {originalPost.user.accountName}
                </Typography>
                <Typography sx={{ fontSize: "15px", color: "black" }}>
                  {originalPost.content}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ marginBottom: "16px" }} />
          </Box>
        )}

        {/* 回覆區域 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 2,
            marginBottom: 2,
          }}
        >
          <Avatar
            src={userData?.avatarUrl || "/default_avatar.jpg"}
            alt="Your Avatar"
            sx={{ width: 40, height: 40 }}
          />
          <Box sx={{ flexGrow: 1 }}>
            <Typography sx={{ fontWeight: "bold", marginBottom: "4px" }}>
              {userData?.accountName || "使用者"}
            </Typography>
            <TextField
              fullWidth
              multiline
              placeholder={
                originalPost
                  ? `回覆 @${originalPost.user.accountName}...`
                  : "輸入您的留言"
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              variant="standard"
              InputProps={{
                disableUnderline: true,
              }}
              sx={{
                fontSize: "15px",
              }}
            />
          </Box>
        </Box>
      </Box>

      <DialogActions>
        <Button
          onClick={onClose}
          sx={{ color: "#888", fontSize: "15px", textTransform: "none" }}
          disabled={loading}
        >
          取消
        </Button>
        <Button
          onClick={handleSubmit}
          variant="outlined"
          disabled={loading || !content.trim()}
          sx={{
            textTransform: "none",
            borderRadius: "8px",
            color: !content.trim() ? "#aaa" : "#000",
            border: "1px solid #ccc",
            backgroundColor: "transparent",
            fontSize: "15px",
            "&:hover": {
              backgroundColor: !content.trim() ? "transparent" : "#f5f5f5",
              border: "1px solid #000",
            },
          }}
        >
          {loading ? "發布中..." : "發佈"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommentDialog;
