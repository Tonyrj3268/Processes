import React, { useState } from "react";
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

interface PostDialogProps {
  open: boolean;
  onClose: () => void;
  // eslint-disable-next-line no-unused-vars
  onSubmit: (content: string) => Promise<void>;
  accountName: string;
  avatarUrl: string;
}

const PostDialog: React.FC<PostDialogProps> = ({
  open,
  onClose,
  onSubmit,
  accountName,
  avatarUrl,
}) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setLoading(true);
    try {
      await onSubmit(content);
      setContent("");
      onClose();
    } catch (error) {
      console.error("Failed to create post:", error);
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
          新串文
        </Typography>
        <Divider sx={{ marginBottom: "16px" }} />
        <Box sx={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
          <Avatar
            src={avatarUrl || "/default_avatar.jpg"}
            alt="User Avatar"
            sx={{ marginRight: 2 }}
          />
          <Typography>{accountName}</Typography>
        </Box>
        <TextField
          fullWidth
          multiline
          placeholder="有什麼新鮮事？"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          variant="standard"
          InputProps={{
            disableUnderline: true,
          }}
          sx={{ fontSize: "15px", padding: "8px" }}
        />
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
          disabled={!content.trim() || loading}
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

export default PostDialog;
