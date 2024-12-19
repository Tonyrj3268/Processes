import React, { useState } from "react";
import { Avatar, Box, Button, Typography } from "@mui/material";
import EditProfileDialog from "./EditProfileDialog";
import { useUser } from '../contexts/UserContext';

interface ProfileHeaderProps {
  userName: string;
  accountName: string;
  followersCount: number;
  avatarUrl: string;
  bio: string;
  isPublic: boolean;
  // eslint-disable-next-line no-unused-vars
  // onProfileUpdate: (updatedProfile: {
  //   userName: string;
  //   avatarUrl: string;
  //   bio: string;
  //   isPublic: boolean;
  // }) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userName,
  accountName,
  followersCount,
  avatarUrl,
  bio,
  isPublic,
  // onProfileUpdate,
}) => {
  // 本地管理狀態
  // const [currentUserName, setCurrentUserName] = useState(userName);
  // const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);
  // const [currentBio, setCurrentBio] = useState(bio);
  // const [currentIsPublic, setCurrentIsPublic] = useState(isPublic);
  // const [editDialogOpen, setEditDialogOpen] = useState(false);

  // // 打開和關閉對話框
  // const handleOpenDialog = () => setEditDialogOpen(true);
  // const handleCloseDialog = () => setEditDialogOpen(false);

  // // 更新本地狀態
  // const handleSaveSuccess = (updatedProfile: {
  //   userName: string;
  //   avatarUrl: string;
  //   bio: string;
  //   isPublic: boolean;
  // }) => {
  //   setCurrentUserName(updatedProfile.userName);
  //   setCurrentAvatarUrl(updatedProfile.avatarUrl);
  //   setCurrentBio(updatedProfile.bio);
  //   setCurrentIsPublic(updatedProfile.isPublic);

  //   onProfileUpdate(updatedProfile);
  // };
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { refreshUserData } = useUser();

  // 打開和關閉對話框
  const handleOpenDialog = () => setEditDialogOpen(true);
  const handleCloseDialog = () => setEditDialogOpen(false);

  // Dialog關閉後的處理
  const handleDialogClose = async () => {
    await refreshUserData(); // 刷新用戶數據
    handleCloseDialog();
  };

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
        <Typography fontSize="14px">{bio || ""}</Typography>
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
        onClose={handleDialogClose}
        userName={userName}
        avatarUrl={avatarUrl}
        bio={bio}
        isPublic={isPublic}
      />
    </Box>
  );
};

export default ProfileHeader;
