import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useBoardStore from '../store/boardStore';
import useNotifStore from '../store/notifStore';

let socket = null;

export const getSocket = () => socket;

const useSocket = (token, activeProjectId) => {
  const initialized = useRef(false);
  const { socketTaskCreated, socketTaskUpdated, socketTaskDeleted, socketBoardReordered } =
    useBoardStore();
  const { addNotification } = useNotifStore();

  useEffect(() => {
    if (!token) return;

    if (!socket) {
      socket = io('/', {
        auth: { token },
        transports: ['websocket'],
      });
    }

    if (!initialized.current) {
      socket.on('task:created', socketTaskCreated);
      socket.on('task:updated', socketTaskUpdated);
      socket.on('task:deleted', socketTaskDeleted);
      socket.on('board:reordered', socketBoardReordered);
      socket.on('notification:new', addNotification);
      initialized.current = true;
    }

    return () => {};
  }, [token]);

  // Join/leave project room when active project changes
  useEffect(() => {
    if (!socket || !activeProjectId) return;
    socket.emit('join:project', { projectId: activeProjectId });
    return () => {
      socket.emit('leave:project', { projectId: activeProjectId });
    };
  }, [activeProjectId]);
};

export default useSocket;