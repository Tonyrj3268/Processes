import React, { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Typography,
  ListItem,
  ListItemAvatar,
  Stack,
} from "@mui/material";

// 移動 Event 介面定義
interface Event {
  _id: string;
  sender: {
    _id: string;
    userName: string;
    accountName: string;
    avatarUrl: string;
  };
  eventType: "follow" | "comment" | "like" | "friend_request";
  details: {
    postText?: string;
    contentText?: string;
    commentText?: string;
    [key: string]: unknown;
  };
  timestamp: Date;
}

// 定義 props 介面
interface EventItemProps {
  event: Event;
}

const EventItem: React.FC<EventItemProps> = ({ event }) => {
  const [isFollowing, setIsFollowing] = useState(false);

  const baseTypographyStyle = {
    color: "#666",
    fontSize: "14px",
    lineHeight: 1.5,
  };

  const getEventContent = () => {
    switch (event.eventType) {
      case "follow":
        return (
          <Typography component="div" sx={baseTypographyStyle}>
            已追蹤你
          </Typography>
        );

      case "comment":
        return (
          <Stack spacing={1}>
            <Typography component="div" sx={baseTypographyStyle}>
              回覆了你的貼文 💭 {event.details.postText}
            </Typography>
            {event.details.commentText && (
              <Typography
                component="div"
                sx={{
                  ...baseTypographyStyle,
                  color: "#000",
                  paddingLeft: "8px",
                }}
              >
                {event.details.commentText}
              </Typography>
            )}
          </Stack>
        );

      case "like":
        return (
          <Stack spacing={1}>
            <Typography component="div" sx={baseTypographyStyle}>
              喜歡你的貼文 ❤️ {event.details.contentText}
            </Typography>
            {event.details.postText && (
              <Typography
                component="div"
                sx={{
                  ...baseTypographyStyle,
                  color: "#666",
                  paddingLeft: "8px",
                }}
              >
                {event.details.postText}
              </Typography>
            )}
          </Stack>
        );
      case "friend_request":
        return (
          <Typography component="div" sx={baseTypographyStyle}>
            追蹤要求
          </Typography>
        );

      default:
        return null;
    }
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

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/follow", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ followerId: event.sender._id }),
      });

      if (response.ok) {
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Failed to follow user:", error);
    }
  };

  const handleHide = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/friend-request/${event.sender._id}/hide`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to hide request");
      }
    } catch (error) {
      console.error("Failed to hide request:", error);
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
  };

  const renderActionButtons = () => {
    if (event.eventType === "friend_request") {
      return (
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleFollow}
            sx={buttonStyles}
          >
            確認
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleHide}
            sx={buttonStyles}
          >
            隱藏
          </Button>
        </Stack>
      );
    }

    if (event.eventType === "follow" && !isFollowing) {
      return (
        <Button
          variant="outlined"
          size="small"
          onClick={handleFollow}
          sx={buttonStyles}
        >
          追蹤對方
        </Button>
      );
    }

    return null;
  };

  return (
    <ListItem
      sx={{
        py: 1.5,
        px: 2,
        display: "flex",
        alignItems: "flex-start",
      }}
    >
      <Box sx={{ display: "flex", flex: 1 }}>
        <ListItemAvatar>
          <Avatar
            src={event.sender.avatarUrl || "/default-avatar.png"}
            alt={event.sender.userName}
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
            }}
          />
        </ListItemAvatar>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              component="span"
              sx={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#000",
              }}
            >
              {event.sender.accountName}
            </Typography>
            <Typography
              component="span"
              sx={{
                fontSize: "14px",
                color: "#666",
              }}
            >
              · {formatTime(event.timestamp)}
            </Typography>
          </Box>
          <Typography
            component="span"
            sx={{
              fontSize: "14px",
              color: "#666",
              display: "block",
              mt: 0.5,
            }}
          >
            {getEventContent()}
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          ml: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {renderActionButtons()}
      </Box>
    </ListItem>
  );
};

export default EventItem;
