import React, { useState } from "react";
import { Avatar, Box, Button, Typography } from "@mui/material";
import EditProfileDialog from "./EditProfileDialog";
import { useUser } from "../contexts/UserContext";

const ProfileHeader: React.FC = () => {
  const { userData } = useUser();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  if (!userData) {
    return <Typography>無法加載使用者資料</Typography>;
  }

  // 打開和關閉對話框
  const handleOpenDialog = () => setEditDialogOpen(true);
  const handleCloseDialog = () => setEditDialogOpen(false);

  return (
    <Box
      sx={{
        padding: "16px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <Box>
          <Typography fontSize="24px" fontWeight="600">
            {userData.userName}
          </Typography>
          <Typography fontSize="14px" color="textSecondary">
            {userData.accountName}
          </Typography>
        </Box>
        <Avatar
          src={userData.avatarUrl}
          alt="Profile Avatar"
          sx={{ width: 80, height: 80 }}
        />
      </Box>

      <Box>
        <Typography fontSize="14px">{userData.bio || ""}</Typography>
        <Typography fontSize="14px" color="textSecondary" margin="16px 0">
          {userData.followersCount} 位粉絲
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Button
          variant="outlined"
          sx={{
            textTransform: "none",
            fontWeight: "bold",
            borderRadius: "10px",
            width: "100%",
            fontSize: "14px",
            color: "#000",
            borderColor: "#ccc",
          }}
          onClick={handleOpenDialog}
        >
          編輯個人檔案
        </Button>
      </Box>

      <EditProfileDialog open={editDialogOpen} onClose={handleCloseDialog} />
    </Box>
  );
};

export default ProfileHeader;
