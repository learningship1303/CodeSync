import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import * as archiver from 'archiver';
import { Room } from '../models/roomModel';

// Interface for requests that have gone through authMiddleware
interface AuthenticatedRequest extends Request {
  user?: { id: string };
}
// 🚀 Helper: Check if room exists for cleaner code
const findRoom = async (roomId: string) => await Room.findOne({ roomId });

const isRoomMember = (room: any, userId?: string): boolean => {
  if (!userId) return false;

  return (
    room.admin.toString() === userId ||
    room.permittedUsers.some((permittedUserId: unknown) => permittedUserId?.toString() === userId)
  );
};

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
/**
 * @desc    Create a brand new collaborative room workspace
 */
export const createRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { roomId, name, password, roomType } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      res.status(401).json({ message: 'Unauthorized: Session missing' });
      return;
    }

    const cleanRoomId = roomId?.trim();
    const cleanName = name?.trim();

    if (!cleanRoomId || !cleanName || !['personal', 'project'].includes(roomType)) {
      res.status(400).json({ message: 'Room ID, name, and room type are required' });
      return;
    }

    if (await findRoom(cleanRoomId)) {
      res.status(400).json({ message: 'Room ID already taken' });
      return;
    }

    let hashedPassword = undefined;
    if (roomType === 'project' && password && password.length > 0) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    } else if (roomType === 'project') {
      res.status(400).json({ message: 'Project rooms require a password' });
      return;
    }

    const defaultFiles = [{
      name: 'main.js',
      path: 'main.js',
      type: 'file' as const,
      content: '// Welcome to CodeSync Space! \nconsole.log("Hello Real-Time World");\n'
    }];
   
const newRoom = await Room.create({
  roomId: cleanRoomId,
  name: cleanName,
  roomType,

  password: hashedPassword,

  admin: adminId,
  permittedUsers: [adminId],
  files: defaultFiles
});
    res.status(201).json({
      message: 'Workspace configured successfully',
      room: {
        _id: newRoom._id,
        id: newRoom._id,
        roomId: newRoom.roomId,
        name: newRoom.name,
        roomType: newRoom.roomType,
        admin: newRoom.admin,
        createdAt: newRoom.createdAt,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Room execution pipeline error', error: (error as Error).message });
  }
};

/**
 * @desc    Validate credentials for entry into a project room
 */
export const verifyRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { roomId, password } = req.body;
    const cleanRoomId = roomId?.trim();
    const userId = authenticatedReq.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized: Session missing' });
      return;
    }

    const room = await findRoom(cleanRoomId);
    
    if (!room) {
      res.status(404).json({ message: 'Workspace does not exist' });
      return;
    }

    const isMember =
      room.admin.toString() === userId ||
      room.permittedUsers.some((permittedUserId) => permittedUserId.toString() === userId);

    if (room.roomType === 'project' && !isMember) {
      if (!password) {
        res.status(403).json({ message: 'Workspace password is required' });
        return;
      }

      const isMatch = room.password ? await bcrypt.compare(password, room.password) : false;

      if (!isMatch) {
        res.status(403).json({ message: 'Invalid credentials' });
        return;
      }

      if (!isMember) {
        room.permittedUsers.push(userId as any);
      }
      await room.save();
    }

    if (room.roomType === 'personal' && !isMember) {
      room.permittedUsers.push(userId as any);
      await room.save();
    }

    res.status(200).json({
      message: 'Authorized',
      room: {
        id: room._id,
        roomId: room.roomId,
        name: room.name,
        roomType: room.roomType,
        admin: room.admin,
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Gatekeeper error', error: (error as Error).message });
  }
};

/**
 * @desc    Fetch historical saved rooms of logged-in profile
 */
export const getUserRooms = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Session identifier missing' });
      return;
    }

    const userRooms = await Room.find({
      $or: [{ admin: userId }, { permittedUsers: userId }],
    })
      .select('-password -roomPasswordPlain')
      .populate('admin', 'name email');

    res.status(200).json(userRooms);
  } catch (error) {
    res.status(500).json({ message: 'Saved history recovery fault', error: (error as Error).message });
  }
};

/**
 * @desc    Save or Update a virtual File system Node
 */
export const saveFileMetadata = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const roomId = req.params.roomId as string;
    const { path, type, content } = req.body;
    const normalizedPath = normalizeWorkspacePath(path || '');

    const room = await findRoom(roomId);
    if (!room) {
      res.status(404).json({ message: 'Workspace context not found.' });
      return;
    }

    if (!isRoomMember(room, authReq.user?.id)) {
      res.status(403).json({ message: 'You do not have access to this workspace.' });
      return;
    }

    if (!normalizedPath || !['file', 'folder'].includes(type)) {
      res.status(400).json({ message: 'Valid file path and type are required.' });
      return;
    }

    const existingFileIndex = room.files.findIndex(f => f.path === normalizedPath);
    if (existingFileIndex > -1) {
      if (room.files[existingFileIndex].type !== type) {
        res.status(409).json({ message: 'A workspace node already exists at this path with a different type.' });
        return;
      }
      room.files[existingFileIndex].content = content ?? room.files[existingFileIndex].content;
      room.files[existingFileIndex].name = fileNameFromPath(normalizedPath);
    } else {
      room.files.push({
        name: fileNameFromPath(normalizedPath),
        path: normalizedPath,
        type,
        content: type === 'file' ? content || '' : '',
      });
    }

    await room.save();
    res.status(200).json({ message: 'File asset buffer saved securely.', files: room.files });
  } catch (error) {
    res.status(500).json({ message: 'Persistence failure', error: (error as Error).message });
  }
};

/**
 * @desc    Compress multi-file records into a downloadable ZIP bundle
 */
export const downloadWorkspaceZip = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const roomId = req.params.roomId as string;
    const room = await findRoom(roomId);
    
    if (!room) {
      res.status(404).json({ message: 'Workspace mapping not found' });
      return;
    }

    if (!isRoomMember(room, authReq.user?.id)) {
      res.status(403).json({ message: 'You do not have access to this workspace.' });
      return;
    }

    res.attachment(`${roomId}-workspace.zip`);
    const archive = new (archiver as any).ZipArchive({ zlib: { level: 9 } });
    
    archive.on('error', (err: Error) => { throw err; });
    archive.pipe(res);

    room.files.forEach((file) => {
      if (file.type === 'folder') {
        archive.append('', { name: file.path.endsWith('/') ? file.path : `${file.path}/` });
        return;
      }

      archive.append(file.content || '', { name: file.path });
    });

    await archive.finalize();
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: 'Archiver system crash', error: (error as Error).message });
    }
  }
};
export const deleteFile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const roomId = req.params.roomId;
    const filePath = Array.isArray(req.params.filePath) ? req.params.filePath.join('/') : req.params.filePath;
    const decodedFilePath = normalizeWorkspacePath(decodeURIComponent(filePath));

    const room = await Room.findOne({ roomId });

    if (!room) {
      res.status(404).json({
        message: 'Room not found'
      });
      return;
    }

    if (!isRoomMember(room, authReq.user?.id)) {
      res.status(403).json({
        message: 'You do not have access to this workspace.'
      });
      return;
    }

  const updatedFiles = room.files.filter(
  file => file.path !== decodedFilePath && !file.path.startsWith(`${decodedFilePath}/`)
);


room.set('files', updatedFiles);
    await room.save();

    res.status(200).json({
      message: 'File deleted'
    });

  } catch (error) {
    res.status(500).json({
      message: 'Delete failed'
    });
  }
};
export const renameFile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { roomId } = req.params;
    const { oldPath, newPath } = req.body;
    const normalizedOldPath = normalizeWorkspacePath(oldPath || '');
    const normalizedNewPath = normalizeWorkspacePath(newPath || '');

    const room = await Room.findOne({
      roomId
    });

    if (!room) {
      res.status(404).json({
        message: 'Room not found'
      });
      return;
    }

    if (!isRoomMember(room, authReq.user?.id)) {
      res.status(403).json({
        message: 'You do not have access to this workspace.'
      });
      return;
    }

    if (!normalizedOldPath || !normalizedNewPath) {
      res.status(400).json({
        message: 'Old and new paths are required'
      });
      return;
    }

    const file = room.files.find(
      (f) => f.path === normalizedOldPath
    );

    if (!file) {
      res.status(404).json({
        message: 'File not found'
      });
      return;
    }

    const destinationExists = room.files.some(
      (node) =>
        node.path === normalizedNewPath &&
        node.path !== normalizedOldPath
    );

    if (destinationExists) {
      res.status(409).json({
        message: 'A workspace node already exists at the destination path'
      });
      return;
    }

    room.files.forEach((node) => {
      if (node.path === normalizedOldPath || node.path.startsWith(`${normalizedOldPath}/`)) {
        node.path = normalizedNewPath + node.path.slice(normalizedOldPath.length);
        node.name = fileNameFromPath(node.path);
      }
    });

    await room.save();

    res.status(200).json({
      message: 'Renamed successfully'
    });

  } catch (error) {
    res.status(500).json({
      message: 'Rename failed'
    });
  }
};
