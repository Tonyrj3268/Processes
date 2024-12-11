import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Avatar,
  Box,
  Button,
  Divider,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Stack,
  CircularProgress,
} from "@mui/material";

interface SenderUser {
  _id: string;
  userName: string;
  accountName: string;
  avatarUrl: string;
}

interface Event {
  _id: string;
  sender: SenderUser;
  eventType: "follow" | "comment" | "like" | "friend_request";
  details: {
    postText?: string;
    contentText?: string;
    commentText?: string;
    [key: string]: unknown;
  };
  timestamp: Date;
}

const EventItem: React.FC<{ event: Event }> = ({ event }) => {
  const [isFollowing, setIsFollowing] = useState(false);

  const baseTypographyStyle = {
    color: '#666',
    fontSize: '14px',
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
                  color: '#666',
                  paddingLeft: '8px'
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
          追蹤
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

const Activity: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCursor, setNewCursor] = useState<string | null>(null);  // 改這裡
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const fetchEvents = useCallback(async (cursor: string | null = null) => {
    try {
      if (cursor) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const queryParams = new URLSearchParams();
      queryParams.append("limit", "10");
      if (cursor) queryParams.append("cursor", cursor);

      const response = await fetch(`/api/event?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();
      setEvents((prev) => (cursor ? [...prev, ...data.events] : data.events));
      setNewCursor(data.newCursor);
    } catch (error) {
      console.error("Error fetching events:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && newCursor && !isLoadingMore) {
          fetchEvents(newCursor);
        }
      },
      { root: null, rootMargin: "0px", threshold: 0.1 },
    );

    observer.observe(loaderRef.current);

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [newCursor, isLoadingMore, fetchEvents]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <div className="page">
      <List disablePadding>
        {events.map((event, index) => (
          <React.Fragment key={event._id}>
            <EventItem event={event} />
            {index < events.length - 1 && (
              <Divider
                sx={{
                  borderColor: "#eee",
                  mx: 2,
                }}
              />
            )}
          </React.Fragment>
        ))}
        {events.length === 0 && !loading && (
          <Box p={4} textAlign="center">
            <Typography color="text.secondary">目前沒有任何動態</Typography>
          </Box>
        )}
      </List>

      {/* Loading Indicator for Auto-Load */}
      <Box ref={loaderRef} sx={{ textAlign: "center", marginY: "16px" }}>
        {isLoadingMore && <CircularProgress size={24} />}
      </Box>
    </div>
  );
};

export default Activity;
