import { useEffect } from "react";
import { connectSocket } from "../utils/socket";

/** Joins the Socket.IO room for whichever single cart is currently open, and leaves it on change/unmount. */
export default function useCartRoom(ownerSub, cartId) {
  useEffect(() => {
    if (!ownerSub || !cartId) return;
    const socket = connectSocket();
    socket.emit("cart:join", { cartId });
    return () => {
      socket.emit("cart:leave", { cartId, ownerSub });
    };
  }, [ownerSub, cartId]);
}
