import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './auth-context';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!user || !token) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        // Determine Socket URL.
        // If VITE_API_BASE_URL is http://localhost:4001/api/v1, we need http://localhost:4001
        const envBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4001/api/v1';
        const serverUrl = envBase.includes('/api/')
            ? envBase.split('/api/')[0]
            : envBase;

        const newSocket = io(serverUrl, {
            path: '/socket.io',
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
            // console.log('Socket connected:', newSocket.id);
            newSocket.emit('join_user_room', user.id);
        });

        // Global notification listener
        newSocket.on('notification', (payload) => {
            // payload: { type, title, message }
            switch (payload.type) {
                case 'success': toast.success(payload.message); break;
                case 'error': toast.error(payload.message); break;
                case 'warning': toast(payload.message, { icon: '⚠️' }); break;
                default: toast(payload.message);
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user, token]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => useContext(SocketContext);
