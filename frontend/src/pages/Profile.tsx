import React from "react";
import { Box } from "@mui/material";
import ProfileHeader from "../components/ProfileHeader";
import ProfileTabs from "../components/ProfileTab";
import { Outlet } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

// interface UserContext {
//   userId: string;
//   userName: string;
//   accountName: string;
//   followersCount: number;
//   avatarUrl: string;
//   bio: string;
//   isPublic: boolean;
// }

const Profile: React.FC = () => {
  // const initialUserData = useOutletContext<UserContext | null>();
  // const [userData, setUserData] = useState(initialUserData);

  // const { userData, updateUserData } = useUser();

  // const handleProfileUpdate = (updatedProfile: {
  //   userName: string;
  //   avatarUrl: string;
  //   bio: string;
  //   isPublic: boolean;
  // }) => {
  //   setUserData((prev) => ({
  //     ...prev,
  //     ...updatedProfile,
  //     userId: prev?.userId || "",
  //     accountName: prev?.accountName || "",
  //     followersCount: prev?.followersCount || 0,
  //   }));
  // };

  // const handleProfileUpdate = (updatedProfile: {
  //   userName: string;
  //   avatarUrl: string;
  //   bio: string;
  //   isPublic: boolean;
  // }) => {
  //   updateUserData(updatedProfile);
  // };

  // return (
  //   <Box className="page">
  //     {userData && (
  //       <ProfileHeader
  //         userName={userData.userName}
  //         accountName={userData.accountName}
  //         followersCount={userData.followersCount}
  //         avatarUrl={userData.avatarUrl}
  //         bio={userData.bio}
  //         isPublic={userData.isPublic}
  //         onProfileUpdate={handleProfileUpdate} // 傳遞更新回調函數
  //       />
  //     )}
  //     <ProfileTabs />
  //     {/* <Outlet
  //       context={{
  //         userId: userData?.userId,
  //         accountName: userData?.accountName,
  //         avatarUrl: userData?.avatarUrl,
  //       }}
  //     /> */}
  //     <Outlet context={userData} />
  //   </Box>
  // );
  const { userData } = useUser();

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
        />
      )}
      <ProfileTabs />
      <Outlet context={userData} />
    </Box>
  );
};

export default Profile;
