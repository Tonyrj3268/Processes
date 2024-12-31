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
  };
  eventType: "follow" | "comment" | "like" | "friend_request";
  details: {
    postText?: string;
    contentText?: string;
    commentText?: string;
    status?: "pending" | "accepted" | "rejected";
    [key: string]: unknown;
  };
  timestamp: Date;
}

interface EventItemProps {
  event: Event;
  onEventUpdate: (eventId: string) => void;
}

const EventItem: React.FC<EventItemProps> = ({ event, onEventUpdate }) => {
  const [followStatus, setFollowStatus] = useState<'none' | 'following' | 'requested'>('none');
  const [actionLoading, setActionLoading] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

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
    if (actionLoading) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No auth token found");

      const response = await fetch("/api/user/follow", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: event.sender._id }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 根據用戶的公開狀態設置不同的追蹤狀態
      setFollowStatus(event.sender.isPublic ? 'following' : 'requested');

    } catch (error) {
      console.error("Failed to follow user:", error);
      // 可以在這裡添加錯誤通知邏輯
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptFollow = async () => {
    if (acceptLoading) return;
    setAcceptLoading(true);

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

      if (!response.ok) {
        throw new Error("Failed to accept follow request");
      }

      onEventUpdate(event._id);
    } catch (error) {
      console.error("Failed to accept follow request:", error);
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleRejectFollow = async () => {
    if (rejectLoading) return;
    setRejectLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/user/reject-follow", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: event.sender._id }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject follow request");
      }

      onEventUpdate(event._id);
    } catch (error) {
      console.error("Failed to reject follow request:", error);
    } finally {
      setRejectLoading(false);
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
    if (event.eventType === "friend_request") {
      if (event.details.status === "accepted") {
        return (
          <Typography
            sx={{
              fontSize: "14px",
              color: "#666",
            }}
          >
            你已接受追蹤
          </Typography>
        );
      }
      return (
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleAcceptFollow}
            disabled={acceptLoading || rejectLoading}
            sx={buttonStyles}
          >
            {acceptLoading ? (
              <CircularProgress
                size={16}
                sx={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  marginLeft: "-8px",
                  marginTop: "-8px",
                  color: "#666"
                }}
              />
            ) : "確認"}
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleRejectFollow}
            disabled={acceptLoading || rejectLoading}
            sx={buttonStyles}
          >
            {rejectLoading ? (
              <CircularProgress
                size={16}
                sx={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  marginLeft: "-8px",
                  marginTop: "-8px",
                  color: "#666"
                }}
              />
            ) : "拒絕"}
          </Button>
        </Stack>
      );
    }

    if (event.eventType === "follow" && followStatus === 'none') {
      return (
        <Button
          variant="outlined"
          size="small"
          onClick={handleFollow}
          disabled={actionLoading}
          sx={buttonStyles}
        >
          {actionLoading ? (
            <CircularProgress
              size={16}
              sx={{
                position: "absolute",
                left: "50%",
                top: "50%",
                marginLeft: "-8px",
                marginTop: "-8px",
                color: "#666"
              }}
            />
          ) : "追蹤對方"}
        </Button>
      );
    }

    if (followStatus === 'following') {
      return (
        <Typography sx={{ fontSize: "14px", color: "#666" }}>
          追蹤中
        </Typography>
      );
    }

    if (followStatus === 'requested') {
      return (
        <Typography sx={{ fontSize: "14px", color: "#666" }}>
          已提出要求
        </Typography>
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
