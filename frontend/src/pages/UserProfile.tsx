import React, { useEffect, useState, useCallback } from "react";
import { Box, CircularProgress, Divider } from "@mui/material";
import { useParams, useOutletContext } from "react-router-dom";
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

interface OutletContext {
  // eslint-disable-next-line no-unused-vars
  setDynamicTitle: (title: string | null) => void;
}

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { setDynamicTitle } = useOutletContext<OutletContext>();
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

  const handleFollowToggle = async () => {
    if (!userProfile || !userProfile._id) {
      console.error("User ID is missing");
      return;
    }

    const token = localStorage.getItem("token");

    // 根據當前狀態確定 API 路徑
    const url =
      userProfile.isFollowing || userProfile.hasRequestedFollow
        ? "/api/user/unfollow"
        : "/api/user/follow";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: userProfile._id }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${
            userProfile.isFollowing || userProfile.hasRequestedFollow
              ? "unfollow"
              : "follow"
          } user: ${await response.text()}`,
        );
      }

      // 按鈕行為處理
      if (userProfile.isFollowing || userProfile.hasRequestedFollow) {
        // 取消追蹤或撤銷請求，重置為「追蹤」
        setUserProfile((prev: typeof userProfile) => ({
          ...prev,
          isFollowing: false,
          hasRequestedFollow: false,
        }));
      } else {
        // 新增追蹤或發送請求
        setUserProfile((prev: typeof userProfile) => ({
          ...prev,
          isFollowing: userProfile.isPublic, // 公開帳號直接追蹤
          hasRequestedFollow: !userProfile.isPublic, // 私密帳號發送請求
        }));
      }
    } catch (error) {
      console.error(
        `Error toggling ${
          userProfile.isFollowing || userProfile.hasRequestedFollow
            ? "unfollow"
            : "follow"
        } status:`,
        error,
      );
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchPosts();
  }, [fetchUserProfile, fetchPosts]);

  useEffect(() => {
    if (userProfile?.accountName) {
      setDynamicTitle(`${userProfile.accountName}`); // 動態更新標題
      document.title = `@${userProfile.accountName}`;
    } else {
      setDynamicTitle("使用者檔案");
    }

    return () => {
      setDynamicTitle(null); // 離開頁面時清除動態標題
    };
  }, [userProfile, setDynamicTitle]);

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
          onFollowToggle={handleFollowToggle}
          // onFollowToggle={() => {
          //   // 追蹤邏輯
          //   console.log("Follow toggle triggered");
          // }}
        />
      )}
      <Divider sx={{ marginY: "8px", margin: "20px 0" }} />
      <PostList posts={posts} onToggleLike={handleToggleLike} />
    </Box>
  );
};

export default UserProfile;
