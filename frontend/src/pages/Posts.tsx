import React, { useEffect, useState, useCallback } from "react";
import {
  Avatar,
  Box,
  Divider,
  Typography,
  CircularProgress,
  IconButton,
  Button,
  Menu,
  MenuItem,
  DialogActions,
  DialogContent,
  DialogTitle,
  Dialog,
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import PostDialog from "../components/PostDialog";
import usePostHandler from "../hooks/usePostHandler";
import { MoreHoriz } from "@mui/icons-material";
import { useUser } from "../contexts/UserContext";

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

const Posts: React.FC = () => {
  const { userData } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updatedContent, setUpdatedContent] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const { dialogOpen, handleOpenDialog, handleCloseDialog, handleSubmit } =
    usePostHandler();

  const fetchPosts = useCallback(async () => {
    if (!userData?.userId) {
      console.error("User ID is missing in fetchPosts");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token is missing in localStorage");
        return;
      }

      const response = await fetch(`/api/post/${userData.userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`);
      }

      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Error fetching user posts:", error);
    } finally {
      setLoading(false);
    }
  }, [userData?.userId]);

  const handleCreatePost = async (formData: FormData) => {
    try {
      await handleSubmit(formData);
      await fetchPosts();
      handleCloseDialog();
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleUpdatePost = async (formData: FormData) => {
    if (!selectedPost) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/post/${selectedPost.postId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to update post");

      await fetchPosts();
      setUpdateDialogOpen(false);
    } catch (error) {
      console.error("Error updating post:", error);
      alert("更新失敗，請稍後再試。");
    }
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/post/${selectedPost.postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete post: ${response.status}`);
      }

      setPosts((prev) =>
        prev.filter((post) => post.postId !== selectedPost.postId),
      );
      console.log("Post deleted successfully");
      handleMenuClose();
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("刪除失敗，請稍後再試。");
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, post: Post) => {
    setAnchorEl(event.currentTarget);
    setSelectedPost(post);
    setUpdatedContent(post.content);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPost(null);
  };

  const handleConfirmDeleteOpen = () => setConfirmDeleteOpen(true);
  const handleConfirmDeleteClose = () => setConfirmDeleteOpen(false);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <Box>
      {/* 發佈貼文框 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          margin: "18px 0",
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

      <PostDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleCreatePost}
        initialContent=""
        initialImages={[]}
        title="新串文"
      />

      <Divider sx={{ marginY: "16px" }} />

      {/* 貼文列表 */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : posts.length === 0 ? (
        <Typography sx={{ textAlign: "center", color: "#aaa", mt: 4 }}>
          尚無貼文
        </Typography>
      ) : (
        posts.map((post) => {
          if (!post.author) {
            console.error("Post author is missing:", post);
            return null;
          }

          return (
            <Box
              key={`${post.postId}-${post.createdAt}`}
              sx={{ marginBottom: "16px" }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Avatar
                  src={
                    post.author.id === userData?.userId
                      ? userData?.avatarUrl || "/default_avatar.jpg"
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
                <IconButton
                  onClick={(e) => handleMenuOpen(e, post)}
                  sx={{ marginLeft: "auto" }}
                >
                  <MoreHoriz />
                </IconButton>
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
          );
        })
      )}

      <Menu
        anchorEl={anchorEl || document.body}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { width: 150, borderRadius: "10px" },
        }}
      >
        <MenuItem
          onClick={() => setUpdateDialogOpen(true)}
          sx={{ color: "black" }}
        >
          編輯
        </MenuItem>
        <MenuItem onClick={handleConfirmDeleteOpen} sx={{ color: "red" }}>
          刪除
        </MenuItem>
      </Menu>

      {/* 更新對話框 */}
      <PostDialog
        open={updateDialogOpen}
        onClose={() => {
          setUpdateDialogOpen(false);
          handleMenuClose();
        }}
        onSubmit={handleUpdatePost}
        initialContent={updatedContent}
        initialImages={selectedPost?.images || []}
        title="編輯貼文"
      />

      {/* 刪除確認對話框 */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={handleConfirmDeleteClose}
        PaperProps={{
          sx: { borderRadius: "20px", padding: "8px" },
        }}
      >
        <DialogTitle>刪除貼文？</DialogTitle>
        <DialogContent>
          <Typography>刪除這則貼文後，即無法恢復顯示。</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleConfirmDeleteClose}
            sx={{ color: "#888", fontSize: "16px", textTransform: "none" }}
          >
            取消
          </Button>
          <Button
            onClick={async () => {
              await handleDeletePost(); // 執行刪除貼文邏輯
              handleConfirmDeleteClose(); // 關閉對話框
            }}
            sx={{
              textTransform: "none",
              color: "red",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            刪除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Posts;
