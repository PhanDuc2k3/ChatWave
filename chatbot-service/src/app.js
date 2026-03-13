require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const chatRoutes = require("./routes/chatRoutes");
const { notFound } = require("./middleware/notFound");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "chatbot-service" });
});

app.use("/api/v1", chatRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
