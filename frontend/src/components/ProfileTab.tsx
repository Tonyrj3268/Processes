import React, { useEffect, useState } from "react";
import { Tab, Tabs } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

const ProfileTabs: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    if (location.pathname === "/profile") setSelectedTab(0);
    else if (location.pathname === "/profile/replies") setSelectedTab(1);
    else if (location.pathname === "/profile/reposts") setSelectedTab(2);
  }, [location.pathname]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
    if (newValue === 0) navigate("/profile");
    if (newValue === 1) navigate("/profile/replies");
    if (newValue === 2) navigate("/profile/reposts");
  };

  return (
    <Tabs
      value={selectedTab}
      onChange={handleTabChange}
      centered
      TabIndicatorProps={{ style: { backgroundColor: "#000" } }}
      sx={{
        "& .MuiTab-root": {
          minWidth: "33.33%",
          fontWeight: "bold",
          fontSize: "15px",
          color: "#ccc !important",
        },
        "& .Mui-selected": {
          color: "#000 !important",
        },
      }}
    >
      <Tab label="串文" />
      <Tab label="回覆" />
      <Tab label="轉發" />
    </Tabs>
  );
};

export default ProfileTabs;
