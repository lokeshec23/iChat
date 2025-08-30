// Basic Socket.IO bootstrap. We’ll add chat events in the next step.
export const initSocket = (io) => {
  try {
    io.on("connection", (socket) => {
      try {
        const { phoneNumber } = socket.handshake.query || {};
        if (phoneNumber) {
          // Join a personal room based on phone number for direct events
          socket.join(`user:${phoneNumber}`);
        }

        console.log(
          "Socket connected:",
          socket.id,
          "phone:",
          phoneNumber || "unknown"
        );

        socket.on("disconnect", () => {
          try {
            console.log("Socket disconnected:", socket.id);
          } catch (err) {
            console.error("disconnect handler error:", err?.message || err);
          }
        });
      } catch (err) {
        console.error("connection handler error:", err?.message || err);
      }
    });
  } catch (err) {
    console.error("initSocket error:", err?.message || err);
  }
};
