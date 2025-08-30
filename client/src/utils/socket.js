import { io } from "socket.io-client";

let socketInstance = null;

export const getSocket = (phoneNumber) => {
  try {
    if (!socketInstance) {
      socketInstance = io(import.meta.env.VITE_SOCKET_URL, {
        transports: ["websocket"],
        query: { phoneNumber: phoneNumber || "" },
      });

      socketInstance.on("connect_error", (err) => {
        console.error("Socket connect_error:", err?.message || err);
      });
    }
    return socketInstance;
  } catch (err) {
    console.error("getSocket error:", err?.message || err);
    return null;
  }
};
