const { Server } = require("socket.io");
const { addMessage, getMessagesByConversation } = require("../repositories/chatRepository");

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
      // Optionally send history on join
      const history = await getMessagesByConversation(String(conversationId));
      socket.emit("chat_history", { conversationId, messages: history || [] });
    });

    // client send message
    socket.on("send_message", async (payload, callback) => {
      try {
        const {
          conversationId,
          senderId,
          senderName,
          conversationName,
          text,
        } = payload || {};
        if (!conversationId || !senderId || !text) {
          if (callback) callback({ ok: false, error: "Missing fields" });
          return;
        }

        const message = await addMessage({
          conversationId: String(conversationId),
          senderId: String(senderId),
          senderName: senderName || "User",
          conversationName: conversationName || null,
          text,
        });

        io.to(String(conversationId)).emit("new_message", message);
        if (callback) callback({ ok: true, data: message });
      } catch (err) {
        console.error("[realtime-service] send_message error", err);
        if (callback) callback({ ok: false, error: "Internal error" });
      }
    });
  });

  return io;
}

module.exports = {
  createChatGateway,
};

