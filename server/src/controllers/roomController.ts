import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import archiver from 'archiver';
import { Room } from '../models/roomModel';

// Interface for requests that have gone through authMiddleware
interface AuthenticatedRequest extends Request {
  user?: { id: string };
}
// 🚀 Helper: Check if room exists for cleaner code
const findRoom = async (roomId: string) => await Room.findOne({ roomId });
/**
 * @desc    Create a brand new collaborative room workspace
 */
export const createRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { roomId, name, password, roomType } = req.body;
    const adminId = req.user?.id;
    console.log('===== CREATE ROOM =====');
console.log('BODY:', req.body);
console.log('USER:', req.user);
console.log('ADMIN ID:', adminId);

    if (!adminId) {
      res.status(401).json({ message: 'Unauthorized: Session missing' });
      return;
    }

    if (await findRoom(roomId)) {
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
   
  console.log('Before Room.create');

const newRoom = await Room.create({
  roomId,
  name,
  roomType,

  password: hashedPassword,

  roomPasswordPlain:
    roomType === 'project'
      ? password
      : null,

  admin: adminId,
  permittedUsers: [adminId],
  files: defaultFiles
});
console.log('ROOM CREATED SUCCESSFULLY');
console.log(newRoom);

    res.status(201).json({
      message: 'Workspace configured successfully',
      room: { id: newRoom._id, roomId: newRoom.roomId, name: newRoom.name, roomType: newRoom.roomType }
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
    const { roomId, password } = req.body;
    const room = await findRoom(roomId);
    
    if (!room) {
      res.status(404).json({ message: 'Workspace does not exist' });
      return;
    }

    if (
  room.roomType === 'project' &&
  room.password &&
  password
) {
  const isMatch = await bcrypt.compare(
    password,
    room.password
  );

  if (!isMatch) {
    res.status(401).json({
      message: 'Invalid credentials'
    });

    return;
  }
}

    res.status(200).json({ message: 'Authorized', roomType: room.roomType,roomPasswordPlain: room.roomPasswordPlain});
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
    }).select('-password'); 

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
    const roomId = req.params.roomId as string;
    const { name, path, type, content } = req.body;

    const room = await findRoom(roomId);
    if (!room) {
      res.status(404).json({ message: 'Workspace context not found.' });
      return;
    }

    const existingFileIndex = room.files.findIndex(f => f.path === path);
    if (existingFileIndex > -1) {
      room.files[existingFileIndex].content = content ?? room.files[existingFileIndex].content;
    } else {
      room.files.push({ name, path, type, content: content || '' });
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
    const roomId = req.params.roomId as string;
    const room = await findRoom(roomId);
    
    if (!room) {
      res.status(404).json({ message: 'Workspace mapping not found' });
      return;
    }

    res.attachment(`${roomId}-workspace.zip`);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.on('error', (err) => { throw err; });
    archive.pipe(res);

    room.files.forEach((file) => {
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
    const { roomId, filePath } = req.params;

    const room = await Room.findOne({ roomId });

    if (!room) {
      res.status(404).json({
        message: 'Room not found'
      });
      return;
    }

  const updatedFiles = room.files.filter(
  file => file.path !== filePath
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
    const { roomId } = req.params;
    const { oldPath, newPath } = req.body;

    const room = await Room.findOne({
      roomId
    });

    if (!room) {
      res.status(404).json({
        message: 'Room not found'
      });
      return;
    }

    const file = room.files.find(
      (f) => f.path === oldPath
    );

    if (!file) {
      res.status(404).json({
        message: 'File not found'
      });
      return;
    }

    file.path = newPath;
    file.name = newPath;

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