require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const routes = require("./routes");
const { notFound } = require("./middleware/notFound");
const { errorHandler } = require("./middleware/errorHandler");
const { requestLogger } = require("./middleware/requestLogger");

const app = express();

// Disable ETag to prevent 304 cached responses for API
app.set("etag", false);

// Core middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  })
);
app.use(express.json());
app.use(morgan("dev"));
app.use(requestLogger);

// Healthcheck
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "core-service" });
});

// API routes
app.use("/api/v1", routes);

// 404 + error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;

