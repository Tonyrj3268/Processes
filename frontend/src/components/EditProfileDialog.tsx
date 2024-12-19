import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  TextField,
  Avatar,
  Typography,
  Switch,
} from "@mui/material";

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  avatarUrl: string;
  bio: string;
  isPublic: boolean;
  // eslint-disable-next-line no-unused-vars
  onSaveSuccess: (updatedProfile: {
    userName: string;
    avatarUrl: string;
    bio: string;
    isPublic: boolean;
  }) => void;
}

const EditProfileDialog: React.FC<EditProfileDialogProps> = ({
  open,
  onClose,
  userName: initialUserName,
  avatarUrl: initialAvatarUrl,
  bio: initialBio,
  isPublic: initialIsPublic,
  onSaveSuccess,
}) => {
  const [userName, setUserName] = useState(initialUserName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [bio, setBio] = useState(initialBio);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUserName(initialUserName);
    setAvatarUrl(initialAvatarUrl);
    setBio(initialBio);
    setIsPublic(initialIsPublic);
  }, [initialUserName, initialAvatarUrl, initialBio, initialIsPublic]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("userName", userName);
      formData.append("bio", bio.trim() || "");
      formData.append("isPublic", JSON.stringify(isPublic));

      const fileInput = fileInputRef.current;
      if (fileInput && fileInput.files?.[0]) {
        formData.append("avatarUrl", fileInput.files[0]);
      }

      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update user profile");
      }

      const data = await response.json();
      // setAvatarUrl(data.user.avatarUrl);
      onSaveSuccess({
        userName: data.user.userName,
        avatarUrl: data.user.avatarUrl,
        bio: data.user.bio || "",
        isPublic: data.user.isPublic,
      });

      onClose();
    } catch (error) {
      console.error("Error updating user profile:", error);
      alert("更新失敗，請稍後再試！");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarUrl(URL.createObjectURL(file)); // 預覽圖片
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
          width: "500px",
        },
      }}
    >
      <DialogContent>
        <Box display="flex" alignItems="center" mb={3}>
          <Box flex={1}>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              color="#000"
              mb={0.5}
            >
              使用者名稱
            </Typography>
            <TextField
              fullWidth
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              variant="standard"
              size="small"
              InputProps={{
                sx: {
                  borderBottom: "1px solid #ccc",
                  "&:hover:not(.Mui-disabled):before": {
                    borderBottom: "1px solid #aaa",
                  },
                  "&:after": {
                    borderBottom: "1px solid #ccc",
                  },
                },
              }}
            />
          </Box>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />
          <Avatar
            src={avatarUrl}
            alt="Profile Avatar"
            sx={{
              width: 60,
              height: 60,
              border: "2px solid #ddd",
              marginLeft: "16px",
              cursor: "pointer",
            }}
            onClick={() => fileInputRef.current?.click()} // 點擊頭像觸發檔案選擇
          />
        </Box>

        <Box flex={1} mb={3}>
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            color="#000"
            mb={0.5}
          >
            個人簡介
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={1}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            variant="standard"
            size="small"
            InputProps={{
              sx: {
                borderBottom: "1px solid #ccc",
                "&:hover:not(.Mui-disabled):before": {
                  borderBottom: "1px solid #aaa",
                },
                "&:after": {
                  borderBottom: "1px solid #ccc",
                },
              },
            }}
          />
        </Box>

        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1" fontWeight="bold" color="#000">
            是否公開個人檔案
          </Typography>
          <Switch
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": {
                color: "#000",
              },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: "#000",
              },
              "& .MuiSwitch-switchBase": {
                color: "#ccc",
              },
              "& .MuiSwitch-track": {
                backgroundColor: "#ddd",
              },
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          fullWidth
          onClick={handleSave}
          variant="contained"
          disabled={loading}
          sx={{
            backgroundColor: "#000",
            color: "#fff",
            padding: "10px",
            margin: "10px",
            borderRadius: "8px",
            "&:hover": {
              backgroundColor: "#333",
            },
            "&:disabled": {
              backgroundColor: "#888",
            },
          }}
        >
          {loading ? "保存中..." : "完成"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProfileDialog;
