/* eslint-disable prettier/prettier */
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Avatar,
  Box,
  Divider,
  Typography,
  CircularProgress,
  IconButton,
  Button,
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import PostDialog from "../components/PostDialog";
import GuestDialog from "../components/GuestDialog";
import usePostHandler from "../hooks/usePostHandler";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";

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

const Home: React.FC = () => {
  const { userData, isLoading: userLoading, isGuest } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isGuestDialogOpen, setGuestDialogOpen] = useState(false);
  const navigate = useNavigate();

  const { dialogOpen, handleOpenDialog, handleCloseDialog, handleSubmit } =
    usePostHandler();

  const loaderRef = useRef<HTMLDivElement | null>(null);

  const fetchPosts = useCallback(
    async (cursor: string | null = null) => {
      try {
        if (cursor) {
          setIsLoadingMore(true);
        } else {
          setLoading(true);
        }

        const token = localStorage.getItem("token");

        const queryParams = new URLSearchParams();
        queryParams.append("limit", "10");
        if (cursor) queryParams.append("cursor", cursor);

        const apiEndpoint = isGuest ? `/api/post/guest` : `/api/post`;

        let headers = {};
        if (token) {
          headers = {
            Authorization: `Bearer ${token}`,
          };
        }

        const response = await fetch(
          `${apiEndpoint}?${queryParams.toString()}`,
          {
            headers,
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch posts: ${response.status}`);
        }

        const data = await response.json();

        setPosts((prev) => {
          const uniquePosts = new Map();
          [...prev, ...data.posts].forEach((post) => {
            uniquePosts.set(post.postId, {
              ...post,
              likesCount: post.likesCount || 0,
              commentCount: post.commentCount || 0,
            });
          });
          return Array.from(uniquePosts.values());
        });

        setNextCursor(data.nextCursor);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    [isGuest],
  );

  const handleToggleLike = async (postId: string, liked: boolean) => {
    const token = localStorage.getItem("token");
    const method = liked ? "DELETE" : "POST";

    // 即時更新 UI 狀態
    setPosts((prev) =>
      prev.map((post) =>
        post.postId === postId
          ? {
            ...post,
            likesCount: post.isLiked
              ? post.likesCount - 1
              : post.likesCount + 1,
            isLiked: !post.isLiked,
          }
          : post,
      ),
    );

    try {
      const response = await fetch(`/api/post/${postId}/like`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to toggle like");
      }

      // // 同步後端的最新數據
      // const data = await response.json();
      // setPosts((prev) =>
      //   prev.map((post) =>
      //     post.postId === postId
      //       ? {
      //         ...post,
      //         likesCount: post.isLiked
      //           ? post.likesCount + 1
      //           : post.likesCount - 1,
      //         isLiked: post.isLiked,
      //       }
      //       : post,
      //   ),
      // );
    } catch (error) {
      console.error("Error toggling like:", error);

      // 如果後端請求失敗，回滾到之前的狀態
      setPosts((prev) =>
        prev.map((post) =>
          post.postId === postId
            ? {
              ...post,
              likesCount: post.isLiked
                ? post.likesCount + 1
                : post.likesCount - 1,
              isLiked: post.isLiked,
            }
            : post,
        ),
      );
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (!loaderRef.current) return;

    const currentLoader = loaderRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor && !isLoadingMore) {
          fetchPosts(nextCursor);
        }
      },
      { root: null, rootMargin: "0px", threshold: 0.1 },
    );

    observer.observe(currentLoader);

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [nextCursor, isLoadingMore, fetchPosts]);

  if (userLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const handleNewPostClick = () => {
    if (isGuest) {
      setGuestDialogOpen(true);
    } else {
      handleOpenDialog();
    }
  };

  return (
    <Box className="page">
      {/* 新貼文輸入框 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          margin: "10px 0",
          cursor: "pointer",
        }}
        onClick={handleNewPostClick}
      >
        <Avatar
          src={userData?.avatarUrl}
          alt="User Avatar"
          sx={{ width: 40, height: 40, marginRight: "16px" }}
        />
        <Typography sx={{ color: "#ccc", flexGrow: 1, fontSize: "15px" }}>
          有什麼新鮮事？
        </Typography>
        <Button
          variant="outlined"
          sx={{
            textTransform: "none",
            borderRadius: "10px",
            padding: "4px 16px",
            color: "#000",
            borderColor: "#ccc",
            fontSize: "15px",
            fontWeight: "bold",
          }}
        >
          發佈
        </Button>
      </Box>
      <Divider sx={{ marginY: "16px" }} />

      {/* 貼文列表 */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        posts.map((post) => (
          <Box
            key={post.postId}
            sx={{ marginBottom: "16px", cursor: "pointer" }}
            onClick={() => navigate(`/posts/${post.postId}`)}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Avatar
                src={post.author.avatarUrl}
                alt={`${post.author.accountName}'s Avatar`}
                sx={{ width: 40, height: 40, marginRight: "8px" }}
              />
              <Box>
                <Typography sx={{ fontSize: "15px", fontWeight: "bold" }}>
                  {post.author.accountName}
                </Typography>
                <Typography sx={{ fontSize: "12px", color: "#aaa" }}>
                  {new Date(post.createdAt).toLocaleString()}
                </Typography>
              </Box>
            </Box>
            <Typography
              sx={{ marginY: "8px", fontSize: "15px", paddingLeft: "8px" }}
            >
              {post.content}
            </Typography>

            {/* 顯示圖片 */}
            <Box
              sx={{
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                marginBottom: "8px",
                scrollSnapType: "x mandatory",
              }}
            >
              {(post.images || []).map((image, index) => (
                <Box
                  key={index}
                  sx={{
                    width: "500px",
                    height: "500px",
                    flexShrink: 0,
                    borderRadius: "8px",
                    overflow: "hidden",
                    scrollSnapAlign: "start",
                  }}
                >
                  <img
                    src={image}
                    alt={`Post`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Box>
              ))}
            </Box>

            <Box sx={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <Box
                sx={{
                  display: "flex",
                  marginRight: "16px",
                  alignItems: "center",
                }}
              >
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleLike(post.postId, post.isLiked);
                  }}
                >
                  {post.isLiked ? (
                    <FavoriteIcon color="error" fontSize="small" />
                  ) : (
                    <FavoriteBorderIcon fontSize="small" />
                  )}
                </IconButton>
                <Typography sx={{ fontSize: "13px" }}>
                  {post.likesCount}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <IconButton>
                  <ChatBubbleOutlineIcon fontSize="small" />
                </IconButton>
                <Typography sx={{ fontSize: "13px" }}>
                  {post.commentCount}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ marginY: "8px" }} />
          </Box>
        ))
      )}

      {/* Loading Indicator for Auto-Load */}
      <Box ref={loaderRef} sx={{ textAlign: "center", marginTop: "16px" }}>
        {isLoadingMore && <CircularProgress />}
      </Box>

      {/* 貼文對話框 */}
      <PostDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        initialContent=""
        initialImages={[]}
        title="新串文"
      />

      <GuestDialog
        isOpen={isGuestDialogOpen}
        onClose={() => setGuestDialogOpen(false)}
      />
    </Box>
  );
};

export default Home;
