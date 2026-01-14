import { Server } from 'socket.io';

const rooms = new Map();

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

socket.on('join-call', (roomCode) => {
  socket.join(roomCode);
  
  if (!rooms.has(roomCode)) {
    rooms.set(roomCode, new Set());
  }
  
  rooms.get(roomCode).add(socket.id);
  socket.emit('room-joined', roomCode);
  io.to(roomCode).emit('user-joined', socket.id);
});


socket.on('signal', (toId, message) => {
  io.to(toId).emit('signal', socket.id, message);
});


socket.on('chat-message', async (data, sender) => {
  const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
  
  if (roomCode) {
    io.to(roomCode).emit('chat-message', data, sender, socket.id);
  }
});


socket.on('chat-message', async (data, sender) => {
  const roomCode = getCurrentRoom(socket);
  
  try {
    await db.collection('meetings').doc(roomCode)
      .collection('messages').add({
        sender,
        data,
        socketIdSender: socket.id,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    
    io.to(roomCode).emit('chat-message', data, sender, socket.id);
  } catch (error) {
    console.error('Error saving message:', error);
  }
});
