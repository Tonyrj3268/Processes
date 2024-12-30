/* eslint-disable prettier/prettier */
import React, { useEffect, useState, useCallback } from "react";
import {
  Avatar,
  Box,
  Typography,
  CircularProgress,
  Divider,
  IconButton,
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { useParams } from "react-router-dom";

interface Comment {
  commentId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    userName: string;
    accountName: string;
    avatarUrl: string;
  };
}

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
  comments: Comment[];
}

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPostDetail = useCallback(async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/post/${postId}/comments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch post detail");
      }

      const data = await response.json();
      setPost(data.postWithComments);
    } catch (error) {
      console.error("Error fetching post detail:", error);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const handleToggleLike = async () => {
    if (!post) return;

    const token = localStorage.getItem("token");
    const method = post.isLiked ? "DELETE" : "POST";

    setPost((prev) =>
      prev
        ? {
          ...prev,
          likesCount: post.isLiked
            ? post.likesCount - 1
            : post.likesCount + 1,
          isLiked: !post.isLiked,
        }
        : null,
    );

    try {
      const response = await fetch(`/api/post/${postId}/like`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to toggle like");
      }
    } catch (error) {
      console.error("Error toggling like:", error);

      setPost((prev) =>
        prev
          ? {
            ...prev,
            likesCount: post.isLiked
              ? post.likesCount + 1
              : post.likesCount - 1,
            isLiked: post.isLiked,
          }
          : null,
      );
    }
  };

  useEffect(() => {
    fetchPostDetail();
  }, [fetchPostDetail]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!post) {
    return (
      <Typography sx={{ textAlign: "center", mt: 4 }}>找不到該貼文</Typography>
    );
  }

  return (
    <Box className="page">
      {/* 貼文內容 */}
      <Box sx={{ margin: "16px 0" }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar
            src={post.author?.avatarUrl || "default_avatar.jpg"}
            alt={`${post.author?.accountName || "預設使用者"}'s Avatar`}
            sx={{ width: 40, height: 40, marginRight: 2 }}
          />
          <Box>
            <Typography sx={{ fontWeight: "bold" }}>
              {post.author?.accountName || "預設使用者"}
            </Typography>
            <Typography sx={{ fontSize: "12px", color: "gray" }}>
              {new Date(post.createdAt).toLocaleString()}
            </Typography>
          </Box>
        </Box>
        <Typography sx={{ mt: 2, fontSize: "15px", marginBottom: "16px" }}>
          {post.content}
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            marginBottom: "8px",
            scrollSnapType: "x mandatory",
          }}
        >
          {post.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Post`}
              style={{
                width: "600px",
                height: "auto",
                flexShrink: 0,
                borderRadius: "8px",
                overflow: "hidden",
                scrollSnapAlign: "start",
              }}
            />
          ))}
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: "4px",
            alignItems: "center",
            marginTop: "8px",
          }}
        >
          <Box
            sx={{
              display: "flex",
              marginRight: "16px",
              alignItems: "center",
            }}
          >
            <IconButton onClick={handleToggleLike}>
              {post.isLiked ? (
                <FavoriteIcon color="error" />
              ) : (
                <FavoriteBorderIcon />
              )}
            </IconButton>
            <Typography>{post.likesCount}</Typography>
          </Box>
          <Box sx={{ display: "flex", gap: "4px", alignItems: "center" }}>
            <IconButton>
              <ChatBubbleOutlineIcon />
            </IconButton>
            <Typography>{post.commentCount}</Typography>
          </Box>
        </Box>
      </Box>
      <Divider />

      {/* 留言列表 */}
      <Box>
        <Typography sx={{ mt: 2, mb: 2, fontWeight: "bold" }}>留言</Typography>
        {post.comments.length === 0 ? (
          <Typography sx={{ color: "gray", textAlign: "center" }}>
            尚無留言
          </Typography>
        ) : (
          post.comments.map((comment) => (
            <Box key={comment.commentId} sx={{ marginBottom: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Avatar
                  src={comment.user?.avatarUrl || "default_avatar.jpg"}
                  alt={`${comment.user.accountName || "預設使用者"}'s Avatar`}
                  sx={{ width: 32, height: 32, marginRight: 1 }}
                />
                <Box>
                  <Typography sx={{ fontWeight: "bold" }}>
                    {comment.user.accountName || "預設使用者"}
                  </Typography>
                  <Typography sx={{ fontSize: "12px", color: "gray" }}>
                    {new Date(comment.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
              <Typography sx={{ mt: 1, ml: 5 }}>{comment.content}</Typography>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
};

export default PostDetail;
