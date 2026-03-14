require("dotenv").config();
const http = require("http");
const app = require("./app");

const PORT = process.env.PORT || 5003;
const server = http.createServer(app);
server.timeout = 90000;

server.listen(PORT, () => {
  console.log(`Chatbot service listening on port ${PORT}`);
});
