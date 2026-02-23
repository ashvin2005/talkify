import { Server } from "socket.io";
import { db } from "../firebase.js";

const rooms = new Map();
const timeOnline = {};

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    let currentRoom = null;

    if (socket.recovered) {
      console.log("Socket reconnected:", socket.id);
      return;
    }

    socket.on("join-call", async (roomCode) => {
      try {
        if (!roomCode || typeof roomCode !== "string") {
          throw new Error("Invalid room code");
        }


        const cleanRoomCode = roomCode.replace(/[^a-zA-Z0-9-]/g, "");


        if (currentRoom) {
          socket.leave(currentRoom);
          removeFromRoom(currentRoom, socket.id);
        }


        currentRoom = cleanRoomCode;
        socket.join(currentRoom);


        if (!rooms.has(currentRoom)) {
          rooms.set(currentRoom, new Set());
        }


        rooms.get(currentRoom).add(socket.id);
        timeOnline[socket.id] = new Date();

        const roomMembers = rooms.get(currentRoom) || new Set();
        const clientsWithInfo = [];
        for (const memberId of roomMembers) {
          const memberSocket = io.sockets.sockets.get(memberId);
          clientsWithInfo.push({
            socketId: memberId,
            username: memberSocket?.handshake?.query?.username || "User",
          });
        }

        socket.emit("room-joined", currentRoom);


        io.to(currentRoom).emit("user-joined", socket.id, clientsWithInfo);


        try {
          const chatSnapshot = await db
            .collection("meetings")
            .doc(currentRoom)
            .collection("messages")
            .orderBy("timestamp")
            .get();

          const messages = [];
          chatSnapshot.forEach((doc) => {
            messages.push(doc.data());
          });


          socket.emit("chat-history", messages);
        } catch (e) {
          console.error("Error fetching messages:", e);
        }
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("join-error", error.message);
      }
    });

    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", async (data, sender) => {
      if (!currentRoom) return;

      console.log("Storing message in Firestore for room:", currentRoom);

      try {
        await db
          .collection("meetings")
          .doc(currentRoom)
          .collection("messages")
          .add({
            sender: sender,
            data: data,
            socketIdSender: socket.id,
            timestamp: new Date(),
          });

        io.to(currentRoom).emit("chat-message", data, sender, socket.id);
      } catch (e) {
        console.error("Error saving message:", e);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);

      if (currentRoom) {
        removeFromRoom(currentRoom, socket.id);
        socket.to(currentRoom).emit("user-left", socket.id);
      }

      delete timeOnline[socket.id];
    });

    function removeFromRoom(room, socketId) {
      if (rooms.has(room)) {
        const roomSet = rooms.get(room);
        roomSet.delete(socketId);

        if (roomSet.size === 0) {
          rooms.delete(room);
        }
      }
    }
  });

  return io;
};
