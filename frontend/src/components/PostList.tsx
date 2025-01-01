import React from "react";
import { Box, Divider, Typography, Avatar, IconButton } from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { MoreHoriz } from "@mui/icons-material";

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

interface PostListProps {
  posts: Post[];
  // eslint-disable-next-line no-unused-vars
  onToggleLike: (postId: string, liked: boolean) => void;
  // eslint-disable-next-line no-unused-vars
  onMenuOpen?: (event: React.MouseEvent<HTMLElement>, post: Post) => void;
  showActions?: boolean;
}

const PostList: React.FC<PostListProps> = ({
  posts,
  onToggleLike,
  onMenuOpen,
  showActions = false,
}) => {
  const { userData } = useUser();
  const navigate = useNavigate();

  if (posts.length === 0) {
    return (
      <Typography sx={{ textAlign: "center", color: "#aaa", mt: 4 }}>
        尚無貼文
      </Typography>
    );
  }

  return (
    <>
      {posts.map((post) => (
        <Box
          key={post.postId}
          sx={{ marginBottom: "16px", cursor: "pointer" }}
          onClick={() => navigate(`/posts/${post.postId}`)}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar
              src={
                userData?.userId === post.author.id
                  ? userData.avatarUrl
                  : post.author.avatarUrl || "/default_avatar.jpg"
              }
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
            {showActions && (
              <Box sx={{ marginLeft: "auto" }}>
                <IconButton
                  onClick={(event) => {
                    event.stopPropagation();
                    onMenuOpen && onMenuOpen(event, post);
                  }}
                >
                  <MoreHoriz />
                </IconButton>
              </Box>
            )}
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
            {post.images.map((image, index) => (
              <Box
                key={index}
                sx={{
                  width: "550px",
                  height: "550px",
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
                  onToggleLike(post.postId, post.isLiked);
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
      ))}
    </>
  );
};

export default PostList;
