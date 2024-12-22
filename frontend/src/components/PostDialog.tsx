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
import { useUser } from "../contexts/UserContext";

interface PostDialogProps {
  open: boolean;
  onClose: () => void;
  // eslint-disable-next-line no-unused-vars
  onSubmit: (formData: FormData) => Promise<void>;
  initialContent?: string;
  initialImages?: string[];
  title: string;
}

const PostDialog: React.FC<PostDialogProps> = ({
  open,
  onClose,
  onSubmit,
  initialContent = "",
  initialImages = [],
  title = "",
}) => {
  const { userData } = useUser();
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(initialImages);
  const [removedImages, setRemovedImages] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setContent(initialContent || "");
      setExistingImages(initialImages || []);
      setImages([]);
      setRemovedImages([]);
    }
  }, [open, initialContent, initialImages]);

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      alert("請輸入內容或上傳圖片");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("content", content.trim());

      // 添加現有圖片的 URL
      existingImages.forEach((imageUrl) => {
        formData.append("existingImages", imageUrl);
      });

      // 添加刪除的圖片 URL
      removedImages.forEach((imageUrl) => {
        formData.append("removedImages", imageUrl);
      });

      // 添加新的圖片
      images.forEach((image) => {
        formData.append("images", image);
      });

      await onSubmit(formData);

      setContent("");
      setImages([]);
      setExistingImages([]);
      setRemovedImages([]);
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
        return newImages.slice(0, 5 - existingImages.length);
      });
    }
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages((prev) => {
      const removedImage = prev[index];
      setRemovedImages((prevRemoved) => [...prevRemoved, removedImage]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleRemoveNewImage = (index: number) => {
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
            src={userData?.avatarUrl || "/default_avatar.jpg"}
            alt="User Avatar"
            sx={{ marginRight: 2 }}
          />
          <Typography>{userData?.accountName}</Typography>
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
          {existingImages.map((image, index) => (
            <Box
              key={`existing-${index}`}
              sx={{
                position: "relative",
                minWidth: "100px",
                height: "100px",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <img
                src={image}
                alt={`existing-upload-preview-${index}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <IconButton
                onClick={() => handleRemoveExistingImage(index)}
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

          {images.map((image, index) => (
            <Box
              key={`new-${index}`}
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
                alt={`new-upload-preview-${index}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <IconButton
                onClick={() => handleRemoveNewImage(index)}
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
          disabled={images.length + existingImages.length >= 5}
        >
          {images.length + existingImages.length >= 5
            ? "最多上傳五張圖片"
            : "上傳圖片"}
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
          disabled={loading || (!content.trim() && images.length === 0)}
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
