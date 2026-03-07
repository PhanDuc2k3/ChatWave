require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");

const { connectToDatabase } = require("./config/db");
const { createChatGateway } = require("./socket/chatGateway");

const PORT = process.env.REALTIME_PORT || 5002;

async function start() {
  await connectToDatabase();

  const app = express();
  const server = http.createServer(app);

  app.use(
    cors({
      origin: "*",
    })
  );
  app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "realtime-service" });
  });

  createChatGateway(server);

  server.listen(PORT, () => {
    console.log(`[realtime-service] listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("[realtime-service] Fatal startup error", err);
  process.exit(1);
});

