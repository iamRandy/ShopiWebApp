import { useEffect, useRef } from "react";
import { getSocket } from "../utils/socket";

const EVENTS = [
  "product:updated",
  "product:deleted",
  "cart:renamed",
  "cart:deleted",
  "cart:ownershipTransferred",
  "collaborator:added",
  "collaborator:roleChanged",
  "collaborator:removed",
];

/**
 * Subscribes once to every cart-sharing socket event and dispatches to whichever
 * handlers are currently passed in (via a ref, so callers don't need to memoize).
 */
export default function useSharedCartEvents(handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const socket = getSocket();
    const listeners = EVENTS.map((event) => {
      const listener = (payload) => handlersRef.current?.[event]?.(payload);
      socket.on(event, listener);
      return [event, listener];
    });
    return () => {
      listeners.forEach(([event, listener]) => socket.off(event, listener));
    };
  }, []);
}
