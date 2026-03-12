const { Server } = require("socket.io");
const { addMessage, getMessagesByConversation, updateMessage, findById } = require("../repositories/chatRepository");

const callRooms = new Map(); // roomId -> Map(socketId -> { userId, userName })

function getCallRoomMembers(roomId) {
  const room = callRooms.get(String(roomId));
  if (!room) return [];
  return Array.from(room.entries()).map(([sid, info]) => ({
    socketId: sid,
    userId: info.userId,
    userName: info.userName,
  }));
}

function createChatGateway(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    // client join conversation room
    socket.on("join_conversation", async ({ conversationId }) => {
      if (!conversationId) return;
      socket.join(String(conversationId));
      const history = await getMessagesByConversation(String(conversationId));
      socket.emit("chat_history", { conversationId, messages: history || [] });
    });

    // join multiple rooms for receiving new_message (no history, for notifications)
    socket.on("join_conversations", ({ conversationIds }) => {
      if (!Array.isArray(conversationIds)) return;
      conversationIds.forEach((id) => {
        if (id) socket.join(String(id));
      });
    });

    // typing indicator
    socket.on("typing_start", ({ conversationId, userId, userName }) => {
      if (!conversationId || !userId) return;
      socket.to(String(conversationId)).emit("user_typing", { conversationId, userId, userName });
    });
    socket.on("typing_stop", ({ conversationId, userId }) => {
      if (!conversationId || !userId) return;
      socket.to(String(conversationId)).emit("user_stopped_typing", { conversationId, userId });
    });

    // client send message
    // --- Video call room ---
    socket.on("join_call_room", ({ roomId, userId, userName }) => {
      if (!roomId || !userId || !userName) return;
      const rid = String(roomId);
      socket.join(rid);
      if (!callRooms.has(rid)) callRooms.set(rid, new Map());
      callRooms.get(rid).set(socket.id, { userId: String(userId), userName: String(userName) });
      const others = getCallRoomMembers(rid).filter((m) => m.socketId !== socket.id);
      socket.emit("call_room_members", { roomId: rid, members: others });
      socket.to(rid).emit("user_joined_call", {
        roomId: rid,
        userId: String(userId),
        userName: String(userName),
        socketId: socket.id,
      });
    });

    socket.on("call_offer", ({ roomId, toSocketId, offer }) => {
      if (!roomId || !toSocketId || !offer) return;
      const rid = String(roomId);
      const room = callRooms.get(rid);
      const from = room?.get(socket.id);
      if (!from) return;
      io.to(toSocketId).emit("call_offer", {
        fromUserId: from.userId,
        fromSocketId: socket.id,
        offer,
      });
    });

    socket.on("call_answer", ({ roomId, toSocketId, answer }) => {
      if (!roomId || !toSocketId || !answer) return;
      const rid = String(roomId);
      const room = callRooms.get(rid);
      const from = room?.get(socket.id);
      if (!from) return;
      io.to(toSocketId).emit("call_answer", {
        fromUserId: from.userId,
        fromSocketId: socket.id,
        answer,
      });
    });

    socket.on("ice_candidate", ({ roomId, toSocketId, candidate }) => {
      if (!roomId || !toSocketId || !candidate) return;
      const rid = String(roomId);
      const room = callRooms.get(rid);
      const from = room?.get(socket.id);
      if (!from) return;
      io.to(toSocketId).emit("ice_candidate", {
        fromUserId: from.userId,
        fromSocketId: socket.id,
        candidate,
      });
    });

    socket.on("leave_call", ({ roomId }) => {
      if (!roomId) return;
      const rid = String(roomId);
      const room = callRooms.get(rid);
      const me = room?.get(socket.id);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) callRooms.delete(rid);
      }
      socket.leave(rid);
      if (me) {
        socket.to(rid).emit("user_left_call", {
          roomId: rid,
          userId: me.userId,
          socketId: socket.id,
        });
      }
    });

    socket.on("disconnect", () => {
      callRooms.forEach((room, rid) => {
        if (room.has(socket.id)) {
          const me = room.get(socket.id);
          room.delete(socket.id);
          if (room.size === 0) callRooms.delete(rid);
          socket.to(rid).emit("user_left_call", {
            roomId: rid,
            userId: me.userId,
            socketId: socket.id,
          });
        }
      });
    });

    socket.on("send_message", async (payload, callback) => {
      try {
        const {
          conversationId,
          senderId,
          senderName,
          conversationName,
          text,
          imageUrl,
        } = payload || {};
        if (!conversationId || !senderId || (!text && !imageUrl)) {
          if (callback) callback({ ok: false, error: "Missing fields" });
          return;
        }

        const message = await addMessage({
          conversationId: String(conversationId),
          senderId: String(senderId),
          senderName: senderName || "User",
          conversationName: conversationName || null,
          text: text || "",
          imageUrl: imageUrl || null,
        });

        io.to(String(conversationId)).emit("new_message", message);
        if (callback) callback({ ok: true, data: message });
      } catch (err) {
        console.error("[realtime-service] send_message error", err);
        if (callback) callback({ ok: false, error: "Internal error" });
      }
    });

    socket.on("edit_message", async (payload, callback) => {
      try {
        const { messageId, senderId, text } = payload || {};
        if (!messageId || !senderId || text == null) {
          if (callback) callback({ ok: false, error: "Missing fields" });
          return;
        }
        const msg = await findById(messageId);
        if (!msg || String(msg.senderId) !== String(senderId)) {
          if (callback) callback({ ok: false, error: "Unauthorized or not found" });
          return;
        }
        const updated = await updateMessage(messageId, { text: String(text).trim(), editedAt: new Date() });
        io.to(String(msg.conversationId)).emit("message_edited", updated);
        if (callback) callback({ ok: true, data: updated });
      } catch (err) {
        console.error("[realtime-service] edit_message error", err);
        if (callback) callback({ ok: false, error: "Internal error" });
      }
    });

    socket.on("delete_message", async (payload, callback) => {
      try {
        const { messageId, senderId } = payload || {};
        if (!messageId || !senderId) {
          if (callback) callback({ ok: false, error: "Missing fields" });
          return;
        }
        const msg = await findById(messageId);
        if (!msg || String(msg.senderId) !== String(senderId)) {
          if (callback) callback({ ok: false, error: "Unauthorized or not found" });
          return;
        }
        const updated = await updateMessage(messageId, { isDeleted: true });
        io.to(String(msg.conversationId)).emit("message_deleted", updated);
        if (callback) callback({ ok: true, data: updated });
      } catch (err) {
        console.error("[realtime-service] delete_message error", err);
        if (callback) callback({ ok: false, error: "Internal error" });
      }
    });
  });

  return io;
}

module.exports = {
  createChatGateway,
};

