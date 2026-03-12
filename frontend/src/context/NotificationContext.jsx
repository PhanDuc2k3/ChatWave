import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { getChatSocket } from "../socket/chatSocket";
import { messageApi } from "../api/messageApi";
import { chatGroupApi } from "../api/chatGroupApi";
import IncomingCallModal from "../components/IncomingCallModal";
import VideoCallRoom from "../components/VideoCallRoom";

const NotificationContext = createContext({ setInCall: () => {} });

export function NotificationProvider({ children }) {
  const location = useLocation();
  const [incomingCall, setIncomingCall] = useState(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [messageNotification, setMessageNotification] = useState(null);
  const hideMsgTimerRef = useRef(null);
  const inCallRef = useRef(false);

  const currentUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("chatwave_user") || "null");
    } catch {
      return null;
    }
  }, [location.pathname]);

  const currentUserId = currentUser?.id ?? currentUser?._id ?? null;
  const currentUserName =
    currentUser?.username ?? currentUser?.email ?? currentUser?.name ?? "Bạn";

  useEffect(() => {
    if (!currentUserId) return;

    const socket = getChatSocket();

    const joinAllConversations = async () => {
      try {
        const [convData, groupData] = await Promise.all([
          messageApi.getConversations(currentUserId),
          chatGroupApi.getMyGroups(currentUserId).catch(() => []),
        ]);
        const ids = [];
        (convData || []).forEach((c) => {
          if (c?.id) ids.push(String(c.id));
          if (c?._id) ids.push(String(c._id));
        });
        (groupData || []).forEach((g) => {
          const gid = g?.id || g?._id;
          if (gid) ids.push(`group:${gid}`);
        });
        const unique = [...new Set(ids)].filter(Boolean);
        if (unique.length > 0) {
          socket.emit("join_conversations", { conversationIds: unique });
        }
      } catch (err) {
        console.error("[NotificationProvider] join conversations", err);
      }
    };

    joinAllConversations();

    const handleNewMessage = (msg) => {
      if (!msg || msg.senderId === String(currentUserId)) return;
      const preview = msg.text
        ? msg.text
        : msg.imageUrl
        ? "Đã gửi ảnh"
        : "Tin nhắn mới";
      const fromName = msg.senderName || "Ai đó";

      if (document.hidden) {
        if (Notification.permission === "granted") {
          new Notification(fromName, {
            body: preview.length > 80 ? preview.slice(0, 80) + "…" : preview,
            icon: "/favicon.ico",
          });
        }
      }
      setMessageNotification({ fromName, preview });
    };

    const handleUserJoinedCall = ({ roomId, userId, userName }) => {
      if (userId === String(currentUserId)) return;
      if (inCallRef.current) return;

      setIncomingCall({
        roomId,
        roomName: roomId?.startsWith("group:") ? "Nhóm chat" : "Cuộc gọi",
        fromUserId: userId,
        fromUserName: userName,
      });
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_joined_call", handleUserJoinedCall);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("user_joined_call", handleUserJoinedCall);
    };
  }, [currentUserId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!messageNotification) return;
    if (hideMsgTimerRef.current) clearTimeout(hideMsgTimerRef.current);
    hideMsgTimerRef.current = setTimeout(() => {
      setMessageNotification(null);
    }, 4000);
    return () => {
      if (hideMsgTimerRef.current) clearTimeout(hideMsgTimerRef.current);
    };
  }, [messageNotification]);

  const acceptCall = () => {
    if (!incomingCall) return;
    setIncomingCall(null);
    inCallRef.current = true;
    setShowVideoCall({
      roomId: incomingCall.roomId,
      roomName: incomingCall.roomName,
    });
  };

  const declineCall = () => {
    setIncomingCall(null);
  };

  const closeVideoCall = () => {
    setShowVideoCall(null);
    inCallRef.current = false;
  };

  const setInCall = React.useCallback((v) => {
    inCallRef.current = !!v;
  }, []);

  return (
    <NotificationContext.Provider value={{ setInCall: setInCall }}>
      {children}

      {messageNotification && (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 flex items-center gap-3 h-32 overflow-hidden">
            <span className="shrink-0 w-9 h-9 rounded-full bg-[#6CB8FF]/20 flex items-center justify-center text-lg">💬</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-800 truncate">{messageNotification.fromName}</p>
              <p className="text-sm text-gray-600 truncate" title={messageNotification.preview}>
                {messageNotification.preview}
              </p>
            </div>
          </div>
        </div>
      )}

      {incomingCall && (
        <IncomingCallModal
          fromUserName={incomingCall.fromUserName}
          roomName={incomingCall.roomName}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
      )}

      {showVideoCall && (
        <VideoCallRoom
          roomId={showVideoCall.roomId}
          roomName={showVideoCall.roomName}
          currentUserId={String(currentUserId)}
          currentUserName={currentUserName}
          onClose={closeVideoCall}
        />
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}
