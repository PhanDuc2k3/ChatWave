const http = require("http");
const app = require("./app");
const { connectToDatabase } = require("./config/db");
const { startGrpcServer } = require("./grpc/userServer");

const PORT = process.env.PORT || 5001;

async function start() {
  await connectToDatabase();

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`Core service listening on port ${PORT}`);
  });

  // Start gRPC server alongside HTTP server
  startGrpcServer();
}

start().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});

