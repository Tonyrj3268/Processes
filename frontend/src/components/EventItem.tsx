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
import { useNavigate } from "react-router-dom";

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
    postId?: string;
  };
  timestamp: Date;
}

interface EventItemProps {
  event: Event;
  // eslint-disable-next-line no-unused-vars
  onEventUpdate: (eventId: string, newData?: Partial<Event>) => void;
}

const EventItem: React.FC<EventItemProps> = ({ event, onEventUpdate }) => {
  const navigate = useNavigate();

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
      setLoading((prev) => ({ ...prev, accept: true }));
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

      onEventUpdate(event._id, {
        details: { ...event.details, status: "accepted" },
      });
    } catch (error) {
      console.error("Failed to accept follow request:", error);
    } finally {
      setLoading((prev) => ({ ...prev, accept: false }));
    }
  };

  const handleRejectFollow = async () => {
    if (loading.reject) return;

    try {
      setLoading((prev) => ({ ...prev, reject: true }));
      const token = localStorage.getItem("token");
      const response = await fetch("/api/user/reject-follow", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: event.sender._id }),
      });

      if (!response.ok) throw new Error("Failed to reject follow request");
      onEventUpdate(event._id);
    } catch (error) {
      console.error("Failed to reject follow request:", error);
    } finally {
      setLoading((prev) => ({ ...prev, reject: false }));
    }
  };

  const handleUnfollow = async () => {
    if (loading.unfollow) return;

    try {
      setLoading((prev) => ({ ...prev, unfollow: true }));
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

      onEventUpdate(event._id, {
        sender: {
          ...event.sender,
          isFollowing: false,
          hasRequestedFollow: false,
        },
      });
    } catch (error) {
      console.error("Failed to unfollow user:", error);
    } finally {
      setLoading((prev) => ({ ...prev, unfollow: false }));
    }
  };

  const handleFollow = async () => {
    if (loading.follow) return;

    try {
      setLoading((prev) => ({ ...prev, follow: true }));
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
          isFollowing: event.sender.isPublic,
          hasRequestedFollow: !event.sender.isPublic,
        },
      });
    } catch (error) {
      console.error("Failed to follow user:", error);
    } finally {
      setLoading((prev) => ({ ...prev, follow: false }));
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

  const followButtonStyles = {
    ...buttonStyles,
    backgroundColor: "#000",
    color: "#fff",
    "&:hover": {
      backgroundColor: "#333",
      boxShadow: "none",
    },
  };

  const renderEventMessage = () => {
    switch (event.eventType) {
      case "follow":
        return "追蹤了你";
      case "like":
        return (
          <Stack spacing={1}>
            <Typography component="div" sx={baseTypographyStyle}>
              喜歡你的貼文 ❤️ {event.details.postText}
            </Typography>
          </Stack>
        );
      case "comment":
        return (
          <>
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
          </>
        );
      default:
        return null;
    }
  };

  const renderActionButtons = () => {
    if (event.eventType === "follow") {
      if (event.details.status === "pending") {
        return (
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleAcceptFollow}
              disabled={loading.accept || loading.reject}
              sx={followButtonStyles}
            >
              {loading.accept ? (
                <CircularProgress
                  size={16}
                  sx={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    marginLeft: "-8px",
                    marginTop: "-8px",
                    color: "#666",
                  }}
                />
              ) : (
                "確認"
              )}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleRejectFollow}
              disabled={loading.accept || loading.reject}
              sx={buttonStyles}
            >
              {loading.reject ? (
                <CircularProgress
                  size={16}
                  sx={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    marginLeft: "-8px",
                    marginTop: "-8px",
                    color: "#666",
                  }}
                />
              ) : (
                "拒絕"
              )}
            </Button>
          </Stack>
        );
      }

      if (event.details.status === "accepted") {
        if (event.sender.isFollowing) {
          return (
            <Button
              variant="outlined"
              size="small"
              onClick={handleUnfollow}
              disabled={loading.unfollow}
              sx={buttonStyles}
            >
              {loading.unfollow ? (
                <CircularProgress
                  size={16}
                  sx={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    marginLeft: "-8px",
                    marginTop: "-8px",
                    color: "#666",
                  }}
                />
              ) : (
                "追蹤中"
              )}
            </Button>
          );
        }

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
                <CircularProgress
                  size={16}
                  sx={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    marginLeft: "-8px",
                    marginTop: "-8px",
                    color: "#666",
                  }}
                />
              ) : event.sender.isPublic ? (
                "追蹤中"
              ) : (
                "已提出要求"
              )}
            </Button>
          );
        }

        return (
          <Button
            variant="outlined"
            size="small"
            onClick={handleFollow}
            disabled={loading.follow}
            sx={followButtonStyles}
          >
            {loading.follow ? (
              <CircularProgress
                size={16}
                sx={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  marginLeft: "-8px",
                  marginTop: "-8px",
                  color: "#666",
                }}
              />
            ) : (
              "追蹤"
            )}
          </Button>
        );
      }
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
            src={event.sender?.avatarUrl || "/default_avatar.jpg"}
            alt={`${event.sender?.accountName || "預設使用者"}'s Avatar`}
            sx={{
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${event.sender._id}`);
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
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${event.sender._id}`);
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
          <Typography sx={baseTypographyStyle}>
            {renderEventMessage()}
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
