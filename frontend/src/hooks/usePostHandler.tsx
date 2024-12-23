import { useState } from "react";

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

const usePostHandler = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDialog = () => setDialogOpen(true);

  const handleCloseDialog = () => setDialogOpen(false);

  const handleSubmit = async (
    formData: FormData,
    // eslint-disable-next-line no-unused-vars
    onPostCreated?: (newPost: Post) => void,
  ) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/post", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      const newPost = await response.json();
      console.log("Post created successfully:", newPost);

      // setDialogOpen(false);
      newPost.author = newPost.author || {
        id: "",
        userName: "預設使用者",
        accountName: "default_user",
        avatarUrl: "/default_avatar.jpg",
      };

      if (onPostCreated) onPostCreated(newPost);
      return newPost;
    } catch (error) {
      console.error("Error while creating post:", error);
      alert("發布失敗，請重試！");
    }
  };

  return {
    dialogOpen,
    handleOpenDialog,
    handleCloseDialog,
    handleSubmit,
  };
};

export default usePostHandler;
