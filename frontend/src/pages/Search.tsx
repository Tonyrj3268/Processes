import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Avatar,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { useNavigate } from "react-router-dom";

interface SearchResult {
  posts: Array<{
    postId: string;
    author: {
      id: string;
      userName: string;
      accountName: string;
      avatarUrl: string;
    };
    content: string;
    likesCount: number;
    commentCount: number;
    createdAt: string;
    isLiked: boolean;
  }>;
  nextCursor: string | null;
}

const Search: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      const response = await axios.get(`/api/search/posts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          q: query,
          limit: 10,
        },
      });

      setSearchResults(response.data);
    } catch (error) {
      console.error("搜尋失敗", error);
      setError("搜尋時發生錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim() && !loading) {
      handleSearch();
    }
  };

  const handleToggleLike = async (postId: string, isLiked: boolean) => {
    try {
      const token = localStorage.getItem("token");
      const method = isLiked ? "DELETE" : "POST";

      await axios({
        method,
        url: `/api/post/${postId}/like`,
        headers: { Authorization: `Bearer ${token}` },
      });

      setSearchResults((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          posts: prev.posts.map((post) =>
            post.postId === postId
              ? {
                  ...post,
                  likesCount: isLiked
                    ? post.likesCount - 1
                    : post.likesCount + 1,
                  isLiked: !isLiked,
                }
              : post,
          ),
        };
      });
    } catch (error) {
      console.error("按讚失敗", error);
    }
  };

  return (
    <div className="page">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        padding={2}
      >
        {/* 搜尋欄位 */}
        <Box
          display="flex"
          alignItems="center"
          width="100%"
          maxWidth="500px"
          border={1}
          borderColor="grey.300"
          borderRadius={4}
          padding={1}
          bgcolor="grey.100"
          mb={2}
        >
          <IconButton>
            <SearchIcon color="action" />
          </IconButton>
          <TextField
            variant="standard"
            placeholder="搜尋"
            fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            InputProps={{
              disableUnderline: true,
            }}
          />
        </Box>

        {/* 載入中狀態 */}
        {loading && (
          <Box display="flex" justifyContent="center" m={4}>
            <CircularProgress />
          </Box>
        )}

        {/* 錯誤訊息 */}
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        {/* 搜尋結果 */}
        {searchResults && !loading && (
          <Box width="100%" mt={2}>
            {searchResults.posts.map((post) => (
              <Box
                key={post.postId}
                sx={{
                  padding: 2,
                  borderBottom: "1px solid #eee",
                  cursor: "pointer",
                }}
                onClick={() => navigate(`/posts/${post.postId}`)}
              >
                <Box display="flex" alignItems="center" mb={1}>
                  <Avatar
                    src={post.author.avatarUrl}
                    sx={{ width: 40, height: 40, mr: 1 }}
                  />
                  <Box>
                    <Typography variant="subtitle1">
                      {post.author.userName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      @{post.author.accountName}
                    </Typography>
                  </Box>
                </Box>
                <Typography sx={{ mb: 1 }}>{post.content}</Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box display="flex" alignItems="center">
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleLike(post.postId, post.isLiked);
                      }}
                    >
                      {post.isLiked ? (
                        <FavoriteIcon color="error" />
                      ) : (
                        <FavoriteBorderIcon />
                      )}
                    </IconButton>
                    <Typography variant="caption">{post.likesCount}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <IconButton>
                      <ChatBubbleOutlineIcon />
                    </IconButton>
                    <Typography variant="caption">
                      {post.commentCount}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </div>
  );
};

export default Search;
