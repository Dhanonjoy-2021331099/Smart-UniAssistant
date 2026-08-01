import { Server } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';

const ROOM_BY_ROLE = {
  student: 'students',
  teacher: 'teachers',
  cr_admin: 'admins',
  super_admin: 'admins',
};

let io = null;

export const initSocket = (httpServer) => {
  if (io) {
    return io;
  }

  io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: false,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('No token provided'));
      }

      const decoded = verifyToken(token);
      socket.userId = decoded.userId;
      socket.role = decoded.role;
      next();
    } catch (error) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const room = ROOM_BY_ROLE[socket.role];

    if (room) {
      socket.join(room);
    }
  });

  return io;
};

export const getIO = () => io;

export default { initSocket, getIO };
