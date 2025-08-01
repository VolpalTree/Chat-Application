import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === "production" 
      ? [process.env.FRONTEND_URL || "*"]
      : ["http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST"],
  },
  transports: ['websocket', 'polling'],
});

export function getReceiverSocketId(userId)  {
    return userSocketMap[userId]
}

const userSocketMap = {};

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);
  console.log("Socket handshake query:", socket.handshake.query);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} mapped to socket ${socket.id}`);
  } else {
    console.log("No userId provided in socket connection");
  }

  // Emit online users to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));
  console.log("Online users:", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    if (userId) {
      delete userSocketMap[userId];
      console.log(`User ${userId} removed from online users`);
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
