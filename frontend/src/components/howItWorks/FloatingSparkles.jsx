import { Sparkles } from "lucide-react";

const SPARKLE_POSITIONS = [
  { left: "6%", top: "6%", size: "h-4 w-4", delay: "0s" },
  { left: "48%", top: "-2%", size: "h-4 w-4", delay: "0.6s" },
  { left: "92%", top: "10%", size: "h-3.5 w-3.5", delay: "1.2s" },
  { left: "0%", top: "46%", size: "h-4 w-4", delay: "0.3s" },
  { left: "98%", top: "50%", size: "h-3.5 w-3.5", delay: "0.9s" },
  { left: "12%", top: "90%", size: "h-3.5 w-3.5", delay: "1.5s" },
  { left: "84%", top: "88%", size: "h-4 w-4", delay: "0.45s" },
];

export default function FloatingSparkles() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 motion-reduce:hidden"
      aria-hidden
    >
      {SPARKLE_POSITIONS.map((sparkle, index) => (
        <div
          key={index}
          className="absolute animate-sparkle-twinkle"
          style={{
            left: sparkle.left,
            top: sparkle.top,
            animationDelay: sparkle.delay,
          }}
        >
          <Sparkles
            className={`${sparkle.size} text-[#FFBC42]`}
            strokeWidth={2.5}
          />
        </div>
      ))}
    </div>
  );
}
