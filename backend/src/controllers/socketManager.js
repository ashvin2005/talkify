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
