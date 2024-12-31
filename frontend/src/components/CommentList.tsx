import React from "react";
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  Typography,
  Menu,
  MenuItem,
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import MoreHoriz from "@mui/icons-material/MoreHoriz";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { useUser } from "../contexts/UserContext";

interface CommentListProps {
  comments: {
    _id: string;
    user: {
      accountName: string;
      avatarUrl: string;
    };
    content: string;
    likesCount: number;
    comments: string[];
    isLiked: boolean;
    createdAt: string;
    updatedAt?: string;
  }[];
  // eslint-disable-next-line no-unused-vars
  onToggleLike: (commentId: string, isLiked: boolean) => void;
  // eslint-disable-next-line no-unused-vars
  onEdit: (commentId: string, currentContent: string) => void;
  // eslint-disable-next-line no-unused-vars
  onDelete: (commentId: string) => void;
}

const CommentList: React.FC<CommentListProps> = ({
  comments,
  onToggleLike,
  onEdit,
  onDelete,
}) => {
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(
    null,
  );
  const [selectedCommentId, setSelectedCommentId] = React.useState<
    string | null
  >(null);
  const { userData } = useUser();

  const handleMoreMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    commentId: string,
  ) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedCommentId(commentId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedCommentId(null);
  };

  return (
    <Box>
      {comments.length === 0 ? (
        <Typography sx={{ color: "gray", textAlign: "center", mt: 2 }}>
          尚無留言
        </Typography>
      ) : (
        comments.map((comment) => (
          <React.Fragment key={comment._id}>
            <Box
              sx={{ display: "flex", alignItems: "flex-start", mb: 1, mt: 2 }}
            >
              <Avatar
                src={comment.user?.avatarUrl || "/default_avatar.jpg"}
                alt={`${comment.user?.accountName || "預設使用者"}'s Avatar`}
                sx={{ width: 40, height: 40, marginRight: 2 }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Typography sx={{ fontWeight: "bold" }}>
                  {comment.user?.accountName || "預設使用者"}
                </Typography>
                <Typography sx={{ fontSize: "12px", color: "gray" }}>
                  {comment.updatedAt
                    ? `${new Date(comment.updatedAt).toLocaleString()}`
                    : `${new Date(comment.createdAt).toLocaleString()}`}
                </Typography>
                <Typography sx={{ mt: 1 }}>{comment.content}</Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mt: 1,
                  }}
                >
                  {/* 愛心按鈕 */}
                  <Box
                    sx={{
                      display: "flex",
                      gap: "4px",
                      alignItems: "center",
                      justifyContent: "flex-start",
                    }}
                  >
                    <IconButton
                      onClick={() => onToggleLike(comment._id, comment.isLiked)}
                      sx={{ padding: 0 }}
                    >
                      {comment.isLiked ? (
                        <FavoriteIcon fontSize="small" color="error" />
                      ) : (
                        <FavoriteBorderIcon fontSize="small" />
                      )}
                    </IconButton>
                    <Typography sx={{ fontSize: "13px" }}>
                      {comment.likesCount}
                    </Typography>
                  </Box>

                  {/* 留言按鈕 */}
                  <Box
                    sx={{
                      display: "flex",
                      gap: "4px",
                      alignItems: "center",
                      justifyContent: "flex-start",
                    }}
                  >
                    <IconButton>
                      <ChatBubbleOutlineIcon fontSize="small" />
                    </IconButton>
                    <Typography sx={{ fontSize: "13px" }}>
                      {comment.comments.length}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <IconButton onClick={(e) => handleMoreMenuOpen(e, comment._id)}>
                <MoreHoriz />
              </IconButton>
            </Box>
            <Divider />
          </React.Fragment>
        ))
      )}

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { width: 150, borderRadius: "10px" },
        }}
      >
        {selectedCommentId &&
        comments.find((c) => c._id === selectedCommentId)?.user.accountName ===
          userData?.accountName ? (
          <>
            <MenuItem
              onClick={() => {
                const currentContent =
                  comments.find((c) => c._id === selectedCommentId)?.content ||
                  "";
                onEdit(selectedCommentId, currentContent);
                handleMenuClose();
              }}
            >
              編輯
            </MenuItem>
            <MenuItem
              onClick={() => {
                onDelete(selectedCommentId);
                handleMenuClose();
              }}
              sx={{ color: "red" }}
            >
              刪除
            </MenuItem>
          </>
        ) : (
          <MenuItem
            sx={{
              textTransform: "none",
              color: "red",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            檢舉
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default CommentList;
