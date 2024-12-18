import { useState } from "react";

const usePostHandler = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDialog = () => setDialogOpen(true);

  const handleCloseDialog = () => setDialogOpen(false);

  const handleSubmit = async (formData: FormData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      const responseData = await response.json();
      console.log("Post created successfully:", responseData);

      setDialogOpen(false);
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
