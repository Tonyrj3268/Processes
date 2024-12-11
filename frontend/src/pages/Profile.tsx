import React from "react";
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
  const userData = useOutletContext<UserContext | null>();

  return (
    <Box className="page">
      {userData && (
        <ProfileHeader
          userName={userData.userName}
          accountName={userData.accountName}
          followersCount={userData.followersCount}
          avatarUrl={userData.avatarUrl}
          bio={userData.bio}
          isPublic={userData.isPublic}
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          onProfileUpdate={() => { }}
        />
      )}
      <ProfileTabs />
      <Outlet
        context={{
          userId: userData?.userId,
          accountName: userData?.accountName,
          avatarUrl: userData?.avatarUrl,
        }}
      />
    </Box>
  );
};

export default Profile;
