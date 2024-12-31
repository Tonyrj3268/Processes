import React from "react";
import { Avatar, Box, IconButton, Typography } from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";

interface PostContentProps {
  post: {
    _id: string;
    user: {
      accountName: string;
      avatarUrl: string;
    };
    content: string;
    images: string[];
    comments: {
      _id: string;
      user: {
        accountName: string;
        avatarUrl: string;
      };
      content: string;
      likesCount: number;
      isLiked: boolean;
    }[];
    likesCount: number;
    createdAt: string;
    isLiked: boolean;
  };
  onToggleLike: () => void;
  onOpenCommentDialog: () => void;
}

const PostContent: React.FC<PostContentProps> = ({
  post,
  onToggleLike,
  onOpenCommentDialog,
}) => (
  <Box sx={{ margin: "16px 0" }}>
    <Box sx={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
      <Avatar
        src={post.user.avatarUrl || "default_avatar.jpg"}
        alt={`${post.user.accountName}'s Avatar`}
        sx={{ width: 40, height: 40, marginRight: 2 }}
      />
      <Box>
        <Typography sx={{ fontWeight: "bold" }}>
          {post.user.accountName || "預設使用者"}
        </Typography>
        <Typography sx={{ fontSize: "12px", color: "gray" }}>
          {new Date(post.createdAt).toLocaleString()}
        </Typography>
      </Box>
    </Box>

    <Typography
      sx={{ mt: 2, fontSize: "15px", paddingLeft: "8px", marginBottom: "16px" }}
    >
      {post.content}
    </Typography>

    {post.images.length > 0 && (
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
              width: "500px",
              height: "500px",
              flexShrink: 0,
              borderRadius: "8px",
              overflow: "hidden",
              scrollSnapAlign: "start",
              objectFit: "cover",
            }}
          />
        ))}
      </Box>
    )}

    {/* Like and Comment Actions */}
    <Box
      sx={{
        display: "flex",
        gap: "4px",
        alignItems: "center",
        marginTop: "8px",
      }}
    >
      <Box sx={{ display: "flex", marginRight: "16px", alignItems: "center" }}>
        <IconButton onClick={onToggleLike}>
          {post.isLiked ? (
            <FavoriteIcon color="error" />
          ) : (
            <FavoriteBorderIcon />
          )}
        </IconButton>
        <Typography>{post.likesCount}</Typography>
      </Box>
      <Box sx={{ display: "flex", gap: "4px", alignItems: "center" }}>
        <IconButton onClick={onOpenCommentDialog}>
          <ChatBubbleOutlineIcon />
        </IconButton>
        <Typography>{post.comments.length}</Typography>
      </Box>
    </Box>
  </Box>
);

export default PostContent;
