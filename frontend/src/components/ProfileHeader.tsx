import React, { useState } from "react";
import { Avatar, Box, Button, Typography } from "@mui/material";
import EditProfileDialog from "./EditProfileDialog";

interface ProfileHeaderProps {
  userName: string;
  accountName: string;
  followersCount: number;
  avatarUrl: string;
  bio: string;
  isPublic: boolean;
  onProfileUpdate: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userName,
  accountName,
  followersCount,
  avatarUrl,
  bio,
  isPublic,
  onProfileUpdate,
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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
            {userName}
          </Typography>
          <Typography fontSize="14px" color="textSecondary">
            {accountName}
          </Typography>
        </Box>
        <Avatar
          src={avatarUrl}
          alt="Profile Avatar"
          sx={{ width: 80, height: 80 }}
        />
      </Box>

      <Box>
        <Typography fontSize="14px">{bio}</Typography>
        <Typography fontSize="14px" color="textSecondary" margin="16px 0">
          {followersCount} 位粉絲
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

      <EditProfileDialog
        open={editDialogOpen}
        onClose={handleCloseDialog}
        userName={userName}
        avatarUrl={avatarUrl}
        bio={bio}
        isPublic={isPublic}
        onSaveSuccess={onProfileUpdate}
      />
    </Box>
  );
};

export default ProfileHeader;
