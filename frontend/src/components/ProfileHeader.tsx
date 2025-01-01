import React, { useState } from "react";
import { Avatar, Box, Button, Typography } from "@mui/material";
import EditProfileDialog from "./EditProfileDialog";
import { useUser } from "../contexts/UserContext";

interface ProfileHeaderProps {
  userProfile: {
    id: string;
    userName: string;
    accountName: string;
    bio: string;
    avatarUrl: string;
    followersCount: number;
    isFollowing?: boolean;
    hasRequestedFollow?: boolean;
  };
  onFollowToggle?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userProfile,
  onFollowToggle,
}) => {
  const { userData } = useUser();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  if (!userData) {
    return <Typography>無法加載使用者資料</Typography>;
  }

  // 判斷是否為登入者的個人檔案
  const isOwnProfile = userData?.userId === userProfile.id;

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
            {userProfile.userName}
          </Typography>
          <Typography fontSize="14px" color="textSecondary">
            @{userProfile.accountName}
          </Typography>
        </Box>
        <Avatar
          src={userProfile.avatarUrl}
          alt="Profile Avatar"
          sx={{ width: 80, height: 80 }}
        />
      </Box>

      <Box>
        <Typography fontSize="14px">{userProfile.bio || ""}</Typography>
        <Typography fontSize="14px" color="textSecondary" margin="16px 0">
          {userProfile.followersCount} 位粉絲
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        {isOwnProfile ? (
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
        ) : (
          <Button
            variant="contained"
            sx={{
              textTransform: "none",
              fontWeight: "bold",
              borderRadius: "10px",
              width: "100%",
              fontSize: "14px",
              color:
                userProfile.isFollowing || userProfile.hasRequestedFollow
                  ? "#000"
                  : "#fff", // 文字顏色：白色或黑色
              backgroundColor:
                userProfile.isFollowing || userProfile.hasRequestedFollow
                  ? "#fff"
                  : "#000", // 白色背景或黑色背景
              border:
                userProfile.isFollowing || userProfile.hasRequestedFollow
                  ? "1px solid #ccc"
                  : "none", // 邊框只在「追蹤中」和「已提出要求」時顯示
              boxShadow: "none",
              "&:hover": {
                backgroundColor:
                  userProfile.isFollowing || userProfile.hasRequestedFollow
                    ? "#f5f5f5"
                    : "#333", // 淺灰背景（hover）或深灰背景（hover）
                boxShadow: "none",
              },
            }}
            onClick={onFollowToggle}
          >
            {userProfile.isFollowing
              ? "追蹤中"
              : userProfile.hasRequestedFollow
                ? "已提出要求"
                : "追蹤"}
          </Button>
        )}
      </Box>

      <EditProfileDialog open={editDialogOpen} onClose={handleCloseDialog} />
    </Box>
  );
};

export default ProfileHeader;
