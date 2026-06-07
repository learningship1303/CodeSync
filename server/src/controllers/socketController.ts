import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../interfaces/socketEvents';
import { Room } from '../models/roomModel';

const userSocketMap: Record<string, { username: string; roomId: string }> = {};

export const handleSocketEngine = (io: Server, socket: Socket) => {
  console.log(`🔌 Connected: ${socket.id}`);

  // 1. Join Room
  socket.on(SOCKET_EVENTS.JOINED, async ({ roomId, username }: { roomId: string; username: string }) => {
    userSocketMap[socket.id] = { username, roomId };
    socket.join(roomId);

    try {
      const roomData = await Room.findOne({ roomId });
      if (roomData) {
        socket.emit('sync-initial-files', roomData.files);
      }
    } catch (err) {
      console.error('Bootstrapping error:', err);
    }

    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    const activeUsers = clients.map((clientId) => ({
      socketId: clientId,
      username: userSocketMap[clientId]?.username
    }));

    io.to(roomId).emit('room-users-update', { activeUsers });
    io.to(roomId).emit(SOCKET_EVENTS.JOINED, { username, socketId: socket.id });
  });

  // 2. File Creation
  socket.on('create-file-node', async ({ roomId, name, path, type }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (room) {
        const newFile = { name, path, type, content: type === 'file' ? '// New code\n' : '' };
        room.files.push(newFile);
        await room.save();
        io.to(roomId).emit('file-node-created', newFile);
      }
    } catch (err) {
      console.error('File creation error:', err);
    }
  });

  // 3. Code Sync
  socket.on(SOCKET_EVENTS.CODE_CHANGE, async ({ roomId, filePath, code }) => {
    socket.in(roomId).emit(SOCKET_EVENTS.CODE_CHANGE, { filePath, code });
    try {
      await Room.updateOne({ roomId, "files.path": filePath }, { $set: { "files.$.content": code } });
    } catch (err) {
      console.error('DB Sync error:', err);
    }
  });

  // 4. Cursor Tracking
  socket.on(SOCKET_EVENTS.CURSOR_MOVE, ({ roomId, cursor }) => {
    socket.in(roomId).emit(SOCKET_EVENTS.CURSOR_MOVE, { socketId: socket.id, cursor });
  });

  // 5. Robust Disconnect Handling
  const handleLeave = () => {
    const user = userSocketMap[socket.id];
    if (user) {
      const { roomId, username } = user;
      socket.in(roomId).emit(SOCKET_EVENTS.USER_DISCONNECTED, { socketId: socket.id, username });
      delete userSocketMap[socket.id];
      
      // Update roster
      const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

const uniqueUsers = new Map();

clients.forEach((clientId) => {
  const user = userSocketMap[clientId];

  if (user && !uniqueUsers.has(user.username)) {
    uniqueUsers.set(user.username, {
      socketId: clientId,
      username: user.username
    });
  }
});

const activeUsers = Array.from(uniqueUsers.values());

io.to(roomId).emit('room-users-update', { activeUsers });
    }
  };

  socket.on('disconnect', handleLeave);
};