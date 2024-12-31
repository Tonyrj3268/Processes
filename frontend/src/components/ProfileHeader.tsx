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
            variant={userProfile.isFollowing ? "outlined" : "contained"}
            sx={{
              textTransform: "none",
              fontWeight: "bold",
              borderRadius: "10px",
              width: "100%",
              fontSize: "14px",
              color: userProfile.isFollowing ? "#000" : "#fff",
              backgroundColor: userProfile.isFollowing ? "#fff" : "#000",
              borderColor: userProfile.isFollowing ? "#ccc" : "#000",
              "&:hover": {
                backgroundColor: userProfile.isFollowing ? "#f5f5f5" : "#333",
              },
            }}
            onClick={onFollowToggle}
          >
            {userProfile.isFollowing ? "已追蹤" : "追蹤"}
          </Button>
        )}
      </Box>

      <EditProfileDialog open={editDialogOpen} onClose={handleCloseDialog} />
    </Box>
  );
};

export default ProfileHeader;
