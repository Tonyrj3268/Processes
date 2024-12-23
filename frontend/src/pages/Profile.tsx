import React from "react";
import { Box } from "@mui/material";
import ProfileHeader from "../components/ProfileHeader";
import ProfileTabs from "../components/ProfileTab";
import { Outlet } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import CircularProgress from "@mui/material/CircularProgress";

const Profile: React.FC = () => {
  const { userData } = useUser();

  if (!userData) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="page">
      <ProfileHeader />
      <ProfileTabs />
      <Outlet
        context={{
          userId: userData?.userId,
          accountName: userData?.accountName,
          avatarUrl: userData.avatarUrl,
        }}
      />
    </Box>
  );
};

export default Profile;
