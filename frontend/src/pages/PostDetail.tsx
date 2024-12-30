import React, { useEffect, useState, useCallback } from "react";
import { Box, Typography, CircularProgress, Divider } from "@mui/material";
import { useParams } from "react-router-dom";
import PostContent from "../components/PostContent";
import CommentList from "../components/CommentList";
import CommentDialog from "../components/CommentDialog";
import DeleteConfirmation from "../components/DeleteConfirmation";

interface PostWithComments {
  _id: string;
  user: {
    _id: string;
    userName: string;
    accountName: string;
    avatarUrl: string;
    isPublic: boolean;
  };
  content: string;
  images: string[];
  likesCount: number;
  comments: {
    _id: string;
    user: {
      _id: string;
      userName: string;
      accountName: string;
      avatarUrl: string;
      isPublic: boolean;
    };
    content: string;
    likesCount: number;
    createdAt: string;
    comments: string[];
    isLiked: boolean;
  }[];
  createdAt: string;
  isLiked: boolean;
}

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<PostWithComments | null>(null);
  const [loading, setLoading] = useState(false);

  const [isCommentDialogOpen, setCommentDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(
    null,
  );

  // 獲取貼文詳情
  const fetchPostDetail = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/post/${postId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch post detail");
      const data = await response.json();
      const postData = {
        ...data.postWithComments,
        comments: data.postWithComments.comments.map((comment: any) => ({
          ...comment,
          isLiked: false,
        })),
      };
      setPost(postData);
    } catch (error) {
      console.error("Error fetching post detail:", error);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  // 貼文愛心
  const handleTogglePostLike = async () => {
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
      await fetch(`/api/post/${postId}/like`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // 留言愛心
  const handleToggleCommentLike = async (
    commentId: string,
    isLiked: boolean,
  ) => {
    const token = localStorage.getItem("token");
    const method = isLiked ? "DELETE" : "POST";
    try {
      await fetch(`/api/comment/${commentId}/like`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      setPost((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.map((comment) =>
                comment._id === commentId
                  ? {
                      ...comment,
                      likesCount: isLiked
                        ? comment.likesCount - 1
                        : comment.likesCount + 1,
                      isLiked: !isLiked,
                    }
                  : comment,
              ),
            }
          : null,
      );
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  // 新留言
  const handleSubmitComment = async (content: string) => {
    const token = localStorage.getItem("token");
    try {
      await fetch(`/api/post/${postId}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
      fetchPostDetail();
      setCommentDialogOpen(false);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // 編輯留言
  const handleSubmitEditComment = async () => {
    if (!selectedCommentId) return;
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/comment/${selectedCommentId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: editingCommentContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.message || "Failed to edit comment");
      }

      const updatedComment = await response.json(); // 獲取更新後的內容

      // 更新本地狀態，避免重新拉取整個貼文列表
      setPost((prevPost) =>
        prevPost
          ? {
              ...prevPost,
              comments: prevPost.comments.map((comment) =>
                comment._id === updatedComment._id ? updatedComment : comment,
              ),
            }
          : null,
      );
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error editing comment:", error);
    }
  };

  // 刪除留言
  const handleDeleteComment = async () => {
    if (!selectedCommentId) return;
    const token = localStorage.getItem("token");
    try {
      await fetch(`/api/comment/${selectedCommentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPostDetail();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  // 載入時獲取貼文詳情
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
      <PostContent
        post={post}
        onToggleLike={handleTogglePostLike}
        onOpenCommentDialog={() => setCommentDialogOpen(true)}
      />
      <Divider />
      <CommentList
        comments={post.comments}
        onToggleLike={handleToggleCommentLike}
        onEdit={(commentId, currentContent) => {
          setSelectedCommentId(commentId);
          setEditingCommentContent(currentContent);
          setEditDialogOpen(true);
        }}
        onDelete={(commentId) => {
          setSelectedCommentId(commentId);
          setDeleteDialogOpen(true);
        }}
      />
      <CommentDialog
        open={isCommentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        onSubmit={handleSubmitComment}
        originalPost={{
          content: post.content,
          user: {
            accountName: post.user.accountName,
            avatarUrl: post.user.avatarUrl,
          },
        }}
      />
      <DeleteConfirmation
        open={isDeleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteComment}
        title="刪除留言？"
        content="刪除這則留言後，即無法恢復顯示。"
      />
      <CommentDialog
        open={isEditDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        initialContent={editingCommentContent}
        onSubmit={handleSubmitEditComment}
        title="編輯留言"
      />
    </Box>
  );
};

export default PostDetail;
