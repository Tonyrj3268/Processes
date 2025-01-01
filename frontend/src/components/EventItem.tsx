import React, { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Typography,
  ListItem,
  ListItemAvatar,
  Stack,
  CircularProgress,
} from "@mui/material";

interface Event {
  _id: string;
  sender: {
    _id: string;
    userName: string;
    accountName: string;
    avatarUrl: string;
    isPublic: boolean;
    isFollowing: boolean;
    hasRequestedFollow: boolean;
  };
  eventType: "follow" | "comment" | "like";
  details: {
    status: "pending" | "accepted";
    postText?: string;
    contentText?: string;
    commentText?: string;
  };
  timestamp: Date;
}

interface EventItemProps {
  event: Event;
  onEventUpdate: (eventId: string, newData?: Partial<Event>) => void;
}

const EventItem: React.FC<EventItemProps> = ({ event, onEventUpdate }) => {
  const [loading, setLoading] = useState({
    accept: false,
    reject: false,
    follow: false,
    unfollow: false,
  });

  const baseTypographyStyle = {
    color: "#666",
    fontSize: "14px",
    lineHeight: 1.5,
  };

  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 60) {
      return `${diffInMinutes}分鐘前`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}小時前`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}天前`;
    }
  };

  const handleAcceptFollow = async () => {
    if (loading.accept) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/user/accept-follow", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: event.sender._id }),
      });

      if (!response.ok) throw new Error("Failed to accept follow request");

      // 更新父組件中的事件狀態
      onEventUpdate(event._id, {
      });
    } catch (error) {
      console.error("Failed to accept follow request:", error);
    } finally {
      if (!response.ok) throw new Error("Failed to reject follow request");
      onEventUpdate(event._id);
    } catch (error) {
      console.error("Failed to reject follow request:", error);
    } finally {
    }
  };

  const handleUnfollow = async () => {
    if (loading.unfollow) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/user/unfollow", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: event.sender._id }),
      });

      if (!response.ok) throw new Error("Failed to unfollow user");

      // 更新本地狀態，移除追蹤請求
      onEventUpdate(event._id, {
        sender: {
          ...event.sender,
      });
    } catch (error) {
      console.error("Failed to unfollow user:", error);
    } finally {
    }
  };

  const handleFollow = async () => {
    if (loading.follow) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/user/follow", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: event.sender._id }),
      });

      if (!response.ok) throw new Error("Failed to follow user");

      onEventUpdate(event._id, {
        sender: {
          ...event.sender,
      });
    } catch (error) {
      console.error("Failed to follow user:", error);
    } finally {
    }
  };

  const buttonStyles = {
    borderRadius: "8px",
    textTransform: "none",
    border: "1px solid #ddd",
    color: "#000",
    backgroundColor: "#fff",
    fontSize: "14px",
    px: 2,
    py: 0.5,
    minWidth: "64px",
    position: "relative",
    "&:disabled": {
      backgroundColor: "#f5f5f5",
      color: "transparent",
    },
  };

  const renderActionButtons = () => {
    // 初始的 pending 狀態，顯示確認/拒絕按鈕
    if (event.details.status === "pending") {
      return (
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleAcceptFollow}
            disabled={loading.accept || loading.reject}
            sx={buttonStyles}
          >
            {loading.accept ? (
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleRejectFollow}
            disabled={loading.accept || loading.reject}
            sx={buttonStyles}
          >
            {loading.reject ? (
          </Button>
        </Stack>
      );
    }

    // 已確認狀態的按鈕顯示邏輯
    if (event.details.status === "accepted") {
      // 如果已經互相追蹤
      if (event.sender.isFollowing) {
        return (
          <Button
            variant="outlined"
            size="small"
            sx={{
              ...buttonStyles,
              cursor: "default",
              "&:hover": {
                backgroundColor: "#fff",
              },
            }}
            disableRipple
          >
            已追蹤
          </Button>
        );
      }

      // 如果已發送追蹤請求但還沒被接受
      if (event.sender.hasRequestedFollow) {
        return (
          <Button
            variant="outlined"
            size="small"
            onClick={handleUnfollow}
            disabled={loading.unfollow}
            sx={buttonStyles}
          >
            {loading.unfollow ? (
                position: "absolute",
                left: "50%",
                top: "50%",
                marginLeft: "-8px",
                marginTop: "-8px",
        </Button>
      );
    }

    return null;
  };

  return (
    <ListItem sx={{
      py: 1.5,
      px: 2,
      display: "flex",
      alignItems: "flex-start",
    }}>
      <Box sx={{ display: "flex", flex: 1 }}>
        <ListItemAvatar>
          <Avatar
            src={event.sender.avatarUrl || "/default-avatar.png"}
            alt={event.sender.accountName}
            sx={{ width: 36, height: 36, borderRadius: "50%" }}
          />
        </ListItemAvatar>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography component="span" sx={{
              fontSize: "14px",
              fontWeight: 500,
              color: "#000",
            }}>
              {event.sender.accountName}
            </Typography>
            <Typography component="span" sx={{
              fontSize: "14px",
              color: "#666",
            }}>
              · {formatTime(event.timestamp)}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box sx={{
        ml: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {renderActionButtons()}
      </Box>
    </ListItem>
  );
};

export default EventItem;
