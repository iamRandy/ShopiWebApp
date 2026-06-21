import { motion } from "framer-motion";

export default function AveeLoader({
  message = "Loading cart…",
  className = "",
  overlay = false,
}) {
  const content = (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative h-24 w-24">
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute left-1/2 top-0 h-10 w-10 -translate-x-1/2">
            <motion.img
              src="/images/Avee.png"
              alt=""
              className="h-full w-full object-contain drop-shadow-md"
              animate={{ rotate: -360 }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </motion.div>
      </div>
      <p className="text-base font-semibold text-stone-700 sm:text-lg dark:text-stone-300">
        {message}
      </p>
    </div>
  );

  if (overlay) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-[var(--color-bg-app)]/80 backdrop-blur-[2px]">
        {content}
      </div>
    );
  }

  return (
    <div className="flex min-h-[12rem] items-center justify-center sm:min-h-[16rem]">
      {content}
    </div>
  );
}
