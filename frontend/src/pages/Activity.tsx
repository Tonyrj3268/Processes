import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Box,
  Divider,
  Typography,
  List,
  CircularProgress,
} from "@mui/material";
import EventItem from "../components/EventItem";

interface SenderUser {
  _id: string;
  userName: string;
  accountName: string;
  avatarUrl: string;
  isPublic: boolean;
}

interface Event {
  _id: string;
  sender: SenderUser;
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

const Activity: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCursor, setNewCursor] = useState<string | null>(null);
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
      // 過濾掉被拒絕的好友請求
      // const filteredEvents = data.events.filter(
      //   (event: Event) =>
      //     !(
      //       event.eventType === "friend_request" &&
      //       event.details.status === "rejected"
      //     ),
      // );
      // setEvents((prev) =>
      //   cursor ? [...prev, ...filteredEvents.events] : data.events,
      // );
      const filteredEvents = data.events.filter(
        (event: Event) =>
          !(
            event.eventType === "friend_request" &&
            event.details.status === "rejected"
          ),
      );

      setEvents((prev) =>
        cursor ? [...prev, ...filteredEvents] : filteredEvents
      );
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

    const currentLoader = loaderRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && newCursor && !isLoadingMore) {
          fetchEvents(newCursor);
        }
      },
      { root: null, rootMargin: "0px", threshold: 0.1 },
    );

    observer.observe(currentLoader);

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [newCursor, isLoadingMore, fetchEvents]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleEventUpdate = (eventId: string) => {
    setEvents((prev) => prev.filter((event) => event._id !== eventId));
  };

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
            <EventItem event={event} onEventUpdate={handleEventUpdate} />
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

      <Box ref={loaderRef} sx={{ textAlign: "center", marginY: "16px" }}>
        {isLoadingMore && <CircularProgress size={24} />}
      </Box>
    </div>
  );
};

export default Activity;
