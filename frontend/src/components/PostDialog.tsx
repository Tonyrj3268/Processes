import React, { useEffect, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  Divider,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface PostDialogProps {
  open: boolean;
  onClose: () => void;
  // eslint-disable-next-line no-unused-vars
  onSubmit: (formData: FormData) => Promise<void>;
  accountName: string;
  avatarUrl: string;
  initialContent?: string;
  title: string;
}

const PostDialog: React.FC<PostDialogProps> = ({
  open,
  onClose,
  onSubmit,
  accountName,
  avatarUrl,
  initialContent = "",
  title = "",
}) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("content", content);
      images.forEach((image) => {
        formData.append("images", image);
      });

      await onSubmit(formData);
      setContent("");
      setImages([]);
      onClose();
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // 限制最多 5 張圖片
      setImages((prev) => {
        const newImages = [...prev, ...files];
        return newImages.slice(0, 5);
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
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

        {/* 圖片預覽區域 */}
        <Box
          sx={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            marginBottom: "16px",
          }}
        >
          {images.map((image, index) => (
            <Box
              key={index}
              sx={{
                position: "relative",
                minWidth: "100px",
                height: "100px",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <img
                src={URL.createObjectURL(image)}
                alt={`upload-preview-${index}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <IconButton
                onClick={() => handleRemoveImage(index)}
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  color: "#fff",
                  "&:hover": { backgroundColor: "rgba(0,0,0,0.8)" },
                }}
              >
                <CloseIcon sx={{ fontSize: "20px" }} />
              </IconButton>
            </Box>
          ))}
        </Box>

        {/* 上傳圖片按鈕 */}
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outlined"
          sx={{
            textTransform: "none",
            borderRadius: "8px",
            fontSize: "14px",
            marginBottom: "8px",
          }}
          disabled={images.length >= 5}
        >
          {images.length >= 5 ? "最多上傳五張圖片" : "上傳圖片"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageUpload}
          multiple
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
