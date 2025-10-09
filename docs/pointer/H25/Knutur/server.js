import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use(express.static("public"));

io.on("connection", (socket) => {
  // Relay cube rotation to everyone except the sender
  socket.on("rotate", (payload) => {
    socket.broadcast.emit("rotate", payload);
  });

  // Optional: reset orientation
  socket.on("reset", () => {
    socket.broadcast.emit("reset");
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://<your-ip>:${PORT}`);
});
