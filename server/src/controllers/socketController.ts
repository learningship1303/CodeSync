import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../interfaces/socketEvents';
import { Room } from '../models/roomModel';
import { ChatMessage } from '../models/chatModel';
import { User } from '../models/userModel';

const userSocketMap: Record<string, { username: string; roomId: string; userId: string }> = {};

const normalizeWorkspacePath = (value: string): string =>
  value
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/(^|\/)\.\.(\/|$)/g, '$1')
    .replace(/\/+/g, '/')
    .trim();

const fileNameFromPath = (path: string): string => {
  const normalized = normalizeWorkspacePath(path);
  return normalized.split('/').filter(Boolean).pop() || normalized;
};

const socketUserId = (socket: Socket): string | undefined => (socket as any).userId;

const isJoinedToRoom = (socket: Socket, roomId: string): boolean => {
  const user = userSocketMap[socket.id];
  return Boolean(user && user.roomId === roomId && socket.rooms.has(roomId));
};

const buildActiveUsers = (io: Server, roomId: string) => {
  const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
  const uniqueUsers = new Map<string, { socketId: string; username: string }>();

  clients.forEach((clientId) => {
    const user = userSocketMap[clientId];
    if (user && !uniqueUsers.has(user.userId)) {
      uniqueUsers.set(user.userId, {
        socketId: clientId,
        username: user.username,
      });
    }
  });

  return Array.from(uniqueUsers.values());
};

export const handleSocketEngine = (io: Server, socket: Socket) => {
  console.log(`🔌 Connected: ${socket.id}`);

  // 1. Join Room
  socket.on(SOCKET_EVENTS.JOINED, async ({ roomId }: { roomId: string }) => {
    try {
      const userId = socketUserId(socket);
      const cleanRoomId = roomId?.trim();
      if (!userId || !cleanRoomId) {
        socket.emit('room-access-denied', { message: 'Invalid room session.' });
        return;
      }

      const [roomData, user] = await Promise.all([
        Room.findOne({
          roomId: cleanRoomId,
          $or: [{ admin: userId }, { permittedUsers: userId }],
        }),
        User.findById(userId).select('name'),
      ]);

      if (!roomData || !user) {
        socket.emit('room-access-denied', { message: 'You do not have access to this workspace.' });
        return;
      }

      userSocketMap[socket.id] = {
        username: user.name,
        roomId: cleanRoomId,
        userId,
      };
      await socket.join(cleanRoomId);

      socket.emit('sync-initial-files', roomData.files);

      const activeUsers = buildActiveUsers(io, cleanRoomId);
      io.to(cleanRoomId).emit('room-users-update', { activeUsers });
      io.to(cleanRoomId).emit(SOCKET_EVENTS.JOINED, {
        username: user.name,
        socketId: socket.id,
      });
    } catch (err) {
      console.error('Bootstrapping error:', err);
      socket.emit('room-access-denied', { message: 'Unable to connect to this workspace.' });
    }
  });

  // 2. File Creation
  socket.on('create-file-node', async ({ roomId, path, type, content }) => {
    try {
      if (!isJoinedToRoom(socket, roomId)) return;

      const normalizedPath = normalizeWorkspacePath(path || '');
      if (!normalizedPath || !['file', 'folder'].includes(type)) return;

      const userId = socketUserId(socket);
      const room = await Room.findOne({
        roomId,
        $or: [{ admin: userId }, { permittedUsers: userId }],
      });
      if (room) {
        if (room.files.some((file) => file.path === normalizedPath)) {
          return;
        }

        const newFile = {
          name: fileNameFromPath(normalizedPath),
          path: normalizedPath,
          type,
          content: type === 'file' ? content || '// New Asset\n' : '',
        };
        room.files.push(newFile);
        await room.save();
        io.to(roomId).emit('file-node-created', newFile);
      }
    } catch (err) {
      console.error('File creation error:', err);
    }
  });

  socket.on('file-node-upserted', ({ roomId, file }) => {
    if (!isJoinedToRoom(socket, roomId)) return;
    if (!file?.path) return;

    const normalizedPath = normalizeWorkspacePath(file.path);
    socket.in(roomId).emit('file-node-upserted', {
      ...file,
      name: fileNameFromPath(normalizedPath),
      path: normalizedPath,
    });
  });

  socket.on('delete-file-node', async ({ roomId, filePath }) => {
    try {
      if (!isJoinedToRoom(socket, roomId)) return;
      const normalizedPath = normalizeWorkspacePath(filePath || '');
      socket.in(roomId).emit('file-node-deleted', { filePath: normalizedPath });
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('rename-file-node', async ({ roomId, oldPath, newPath }) => {
    try {
      if (!isJoinedToRoom(socket, roomId)) return;
      socket.in(roomId).emit('file-node-renamed', {
        oldPath: normalizeWorkspacePath(oldPath || ''),
        newPath: normalizeWorkspacePath(newPath || ''),
      });
    } catch (err) {
      console.error(err);
    }
  });

  // 3. Code Sync
  socket.on(SOCKET_EVENTS.CODE_CHANGE, async ({ roomId, filePath, code }) => {
    if (!isJoinedToRoom(socket, roomId) || typeof code !== 'string' || code.length > 1024 * 1024) return;

    const normalizedPath = normalizeWorkspacePath(filePath || '');
    if (!normalizedPath) return;

    socket.in(roomId).emit(SOCKET_EVENTS.CODE_CHANGE, { filePath: normalizedPath, code });
    try {
      const userId = socketUserId(socket);
      await Room.updateOne(
        {
          roomId,
          "files.path": normalizedPath,
          $or: [{ admin: userId }, { permittedUsers: userId }],
        },
        { $set: { "files.$.content": code } }
      );
    } catch (err) {
      console.error('DB Sync error:', err);
    }
  });

  // 4. Cursor Tracking
  socket.on(SOCKET_EVENTS.CURSOR_MOVE, ({ roomId, cursor, currentFile }) => {
    if (!isJoinedToRoom(socket, roomId)) return;

    socket.in(roomId).emit(SOCKET_EVENTS.CURSOR_MOVE, {
      socketId: socket.id,
      username: userSocketMap[socket.id]?.username,
      cursor,
      currentFile,
    });
  });

  // 5. Chat Messages
  socket.on('send-message', async ({ roomId, message }) => {
    try {
      const user = userSocketMap[socket.id];
      if (!user || user.roomId !== roomId || typeof message !== 'string' || !message.trim()) return;

      const chatMessage = await ChatMessage.create({
        roomId,
        userId: user.userId || socket.id,
        username: user.username,
        message: message.trim(),
        timestamp: new Date(),
        avatar: user.username.charAt(0).toUpperCase(),
      });

      io.to(roomId).emit('receive-message', {
        _id: chatMessage._id,
        username: chatMessage.username,
        message: chatMessage.message,
        timestamp: chatMessage.timestamp,
        avatar: chatMessage.avatar,
      });
    } catch (err) {
      console.error('Chat message error:', err);
    }
  });

  // Typing Indicator
  socket.on('typing', ({ roomId }) => {
    const user = userSocketMap[socket.id];
    if (user?.roomId === roomId) {
      socket.in(roomId).emit('user-typing', { username: user.username });
    }
  });

  socket.on('stop-typing', ({ roomId }) => {
    const user = userSocketMap[socket.id];
    if (user?.roomId === roomId) {
      socket.in(roomId).emit('user-stop-typing', { username: user.username });
    }
  });

  // 6. Robust Disconnect Handling
  const handleLeave = () => {
    const user = userSocketMap[socket.id];
    if (user) {
      const { roomId, username } = user;

      // Compute active users before deleting the mapping to avoid timing-dependent empty sets
      const activeUsers = buildActiveUsers(io, roomId);

      socket.in(roomId).emit(SOCKET_EVENTS.USER_DISCONNECTED, { socketId: socket.id, username });

      delete userSocketMap[socket.id];

      io.to(roomId).emit('room-users-update', { activeUsers });
    }
  };

  // More reliable presence updates across different socket teardown timings
  socket.on('disconnecting', handleLeave);
  // Keep disconnect handler as well (covers cases where disconnecting isn't fired)
  socket.on('disconnect', handleLeave);
};
