import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

const DEFAULT_HOSTNAMES = [
  "amazon.com",
  "target.com",
  "bestbuy.com",
  "walmart.com",
  "etsy.com",
  "nike.com",
];

export function useHostnameTypewriter({
  hostnames = DEFAULT_HOSTNAMES,
  enabled = true,
  typingMs = 85,
  pauseMs = 1400,
  deleteMs = 45,
  emptyPauseMs = 700,
} = {}) {
  const reducedMotion = useReducedMotion();
  const hostnamesRef = useRef(hostnames);
  hostnamesRef.current = hostnames;

  const [hostname, setHostname] = useState("");
  const stateRef = useRef({
    siteIndex: 0,
    charIndex: 0,
    phase: "typing",
  });

  useEffect(() => {
    if (reducedMotion) {
      setHostname(hostnamesRef.current[0]);
      return;
    }

    if (!enabled) return;

    let cancelled = false;
    let timerId = 0;

    const schedule = (delay) => {
      timerId = window.setTimeout(tick, delay);
    };

    const tick = () => {
      if (cancelled) return;

      const hostnamesList = hostnamesRef.current;
      const state = stateRef.current;
      const current = hostnamesList[state.siteIndex];

      if (state.phase === "typing") {
        if (state.charIndex < current.length) {
          state.charIndex += 1;
          setHostname(current.slice(0, state.charIndex));
          schedule(typingMs);
        } else {
          state.phase = "pause_full";
          schedule(pauseMs);
        }
      } else if (state.phase === "pause_full") {
        state.phase = "deleting";
        schedule(deleteMs);
      } else if (state.phase === "deleting") {
        if (state.charIndex > 0) {
          state.charIndex -= 1;
          setHostname(current.slice(0, state.charIndex));
          schedule(deleteMs);
        } else {
          state.phase = "pause_empty";
          schedule(emptyPauseMs);
        }
      } else if (state.phase === "pause_empty") {
        state.siteIndex = (state.siteIndex + 1) % hostnamesList.length;
        state.charIndex = 0;
        state.phase = "typing";
        setHostname("");
        schedule(typingMs);
      }
    };

    schedule(typingMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [
    enabled,
    reducedMotion,
    typingMs,
    pauseMs,
    deleteMs,
    emptyPauseMs,
  ]);

  return reducedMotion ? hostnamesRef.current[0] : hostname;
}
