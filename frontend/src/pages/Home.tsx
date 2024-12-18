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
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import PostDialog from "../components/PostDialog";
import { useOutletContext } from "react-router-dom";
import usePostHandler from "../hooks/usePostHandler";

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
}

const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const userData = useOutletContext<{
    accountName: string;
    avatarUrl: string;
  }>();
  const { dialogOpen, handleOpenDialog, handleCloseDialog, handleSubmit } =
    usePostHandler();

  const loaderRef = useRef<HTMLDivElement | null>(null);

  const fetchPosts = useCallback(async (cursor: string | null = null) => {
    try {
      if (cursor) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }

      const token = localStorage.getItem("token");
      const isGuest = !token; // 判斷是否為訪客

      const queryParams = new URLSearchParams();
      queryParams.append("limit", "10");
      if (cursor) queryParams.append("cursor", cursor);

      // 根據是否為訪客選擇不同的 API 端點
      const apiEndpoint = isGuest ? `/api/post/guest` : `/api/post`;

      // 設置請求頭
      let headers = {};
      if (token) {
        headers = {
          Authorization: `Bearer ${token}`,
        };
      }

      const response = await fetch(`${apiEndpoint}?${queryParams.toString()}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`);
      }

      const data = await response.json();
      // setPosts((prev) => [...prev, ...data.posts]);

      setPosts((prev) => {
        const uniquePosts = new Map();
        [...prev, ...data.posts].forEach((post) => {
          uniquePosts.set(post.postId, post);
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
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor && !isLoadingMore) {
          fetchPosts(nextCursor);
        }
      },
      { root: null, rootMargin: "0px", threshold: 0.1 },
    );

    observer.observe(loaderRef.current);

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [nextCursor, isLoadingMore, fetchPosts]);

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
        onClick={handleOpenDialog}
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
          <Box key={post.postId} sx={{ marginBottom: "16px" }}>
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
                flexWrap: "wrap",
                marginBottom: "8px",
              }}
            >
              {(post.images || []).map((image, index) => (
                <Box
                  key={index}
                  sx={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={image}
                    alt={`Post image ${index}`}
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
                <IconButton>
                  <FavoriteBorderIcon fontSize="small" />
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
        accountName={userData?.accountName}
        avatarUrl={userData?.avatarUrl}
        title="新串文"
      />
    </Box>
  );
};

export default Home;
