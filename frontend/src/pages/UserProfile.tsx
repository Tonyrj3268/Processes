import React, { useEffect, useState, useCallback } from "react";
import { Box, CircularProgress, Divider } from "@mui/material";
import { useParams } from "react-router-dom";
import PostList from "../components/PostList";
import ProfileHeader from "../components/ProfileHeader";

interface Post {
  postId: string;
  author: {
    id: string;
    userName: string;
    accountName: string;
    avatarUrl: string;
  };
  content: string;
  images: string[];
  likesCount: number;
  commentCount: number;
  createdAt: string;
  isLiked: boolean;
}

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userProfile, setUserProfile] = useState<any>(null);

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch user profile");
      const data = await response.json();
      setUserProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/post/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch posts");
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleToggleLike = async (postId: string, liked: boolean) => {
    const token = localStorage.getItem("token");
    const method = liked ? "DELETE" : "POST";

    // 即時更新 UI
    setPosts((prev) =>
      prev.map((post) =>
        post.postId === postId
          ? {
              ...post,
              likesCount: liked ? post.likesCount - 1 : post.likesCount + 1,
              isLiked: !liked,
            }
          : post,
      ),
    );

    try {
      await fetch(`/api/post/${postId}/like`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchPosts();
  }, [fetchUserProfile, fetchPosts]);

  useEffect(() => {
    if (userProfile?.accountName) {
      document.title = `@${userProfile.accountName}`;
    } else {
      document.title = "使用者檔案";
    }
  }, [userProfile]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="page">
      {userProfile && (
        <ProfileHeader
          userProfile={userProfile}
          onFollowToggle={() => {
            // 追蹤邏輯
            console.log("Follow toggle triggered");
          }}
        />
      )}
      <Divider sx={{ marginY: "8px", margin: "20px 0" }} />
      <PostList posts={posts} onToggleLike={handleToggleLike} />
    </Box>
  );
};

export default UserProfile;
