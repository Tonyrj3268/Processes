import React, { useState } from "react";
import { Box } from "@mui/material";
import ProfileHeader from "../components/ProfileHeader";
import ProfileTabs from "../components/ProfileTab";
import { Outlet, useOutletContext } from "react-router-dom";

interface UserContext {
  userId: string;
  userName: string;
  accountName: string;
  followersCount: number;
  avatarUrl: string;
  bio: string;
  isPublic: boolean;
}

const Profile: React.FC = () => {
  const initialUserData = useOutletContext<UserContext | null>();
  const [userData, setUserData] = useState(initialUserData);
  const [avatarTimestamp, setAvatarTimestamp] = useState<number>(Date.now()); // 新增時間戳狀態

  const handleProfileUpdate = (updatedProfile: {
    userName: string;
    avatarUrl: string;
    bio: string;
    isPublic: boolean;
  }) => {
    setUserData((prev) => ({
      ...prev,
      ...updatedProfile,
      userId: prev?.userId || "",
      accountName: prev?.accountName || "",
      followersCount: prev?.followersCount || 0,
    }));
    setAvatarTimestamp(Date.now()); // 更新時間戳
  };

  return (
    <Box className="page">
      {userData && (
        <ProfileHeader
          userName={userData.userName}
          accountName={userData.accountName}
          followersCount={userData.followersCount}
          avatarUrl={`${userData.avatarUrl}?t=${avatarTimestamp}`} // 附加時間戳
          bio={userData.bio}
          isPublic={userData.isPublic}
          onProfileUpdate={handleProfileUpdate} // 傳遞更新回調函數
        />
      )}
      <ProfileTabs />
      <Outlet
        context={{
          userId: userData?.userId,
          accountName: userData?.accountName,
          avatarUrl: userData?.avatarUrl,
          avatarTimestamp,
        }}
      />
    </Box>
  );
};

export default Profile;
