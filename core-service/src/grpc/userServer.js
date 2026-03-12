const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const userRepository = require("../repositories/userRepository");
const friendRepository = require("../repositories/friendRepository");

const PROTO_PATH = path.join(__dirname, "..", "..", "proto", "user.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const chatwave = protoDescriptor.chatwave;

async function getUser(call, callback) {
  try {
    const { id } = call.request || {};
    if (!id) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "id is required",
      });
    }
    const user = await userRepository.findById(id);
    if (!user) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "User not found",
      });
    }
    callback(null, {
      user: {
        id: user.id || user._id?.toString(),
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    // Do not crash the server on error
    console.error("[gRPC] GetUser error", err);
    callback({
      code: grpc.status.INTERNAL,
      message: "Internal server error",
    });
  }
}

async function listFriends(call, callback) {
  try {
    const { userId } = call.request || {};
    if (!userId) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "userId is required",
      });
    }
    const friends = await friendRepository.getFriendsForUser(userId);
    const items =
      friends?.map((f) => ({
        id: f.id,
        username: f.username,
        email: f.email,
      })) || [];
    callback(null, { friends: items });
  } catch (err) {
    console.error("[gRPC] ListFriends error", err);
    callback({
      code: grpc.status.INTERNAL,
      message: "Internal server error",
    });
  }
}

function startGrpcServer() {
  const server = new grpc.Server();
  server.addService(chatwave.UserService.service, {
    GetUser: getUser,
    ListFriends: listFriends,
  });

  const port = process.env.GRPC_PORT || "50051";
  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err, boundPort) => {
      if (err) {
        console.error("[gRPC] Failed to bind:", err);
        return;
      }
      server.start();
      console.log(`[gRPC] UserService listening on port ${boundPort}`);
    }
  );
}

module.exports = {
  startGrpcServer,
};

