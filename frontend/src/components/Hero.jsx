import { ChevronsDown, Sparkles, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useState, useEffect } from "react";

const EXTENSION_URL =
  "https://chromewebstore.google.com/detail/chaos-cart-saver/bjofoogkolnnpldckgedhdeekajhnpcb?authuser=0&hl=en";

const CART_BURST_MOBILE = [
  {
    color: "#b45309",
    scale: 0.9,
    rest: { x: -125, y: 40, rotate: -18 },
    delay: 0.1,
  },
  {
    color: "#FFBC42",
    scale: 1.1,
    rest: { x: -65, y: 82, rotate: 8 },
    delay: 0.17,
  },
  {
    color: "#57382a",
    scale: 0.85,
    rest: { x: 14, y: 96, rotate: -5 },
    delay: 0.24,
  },
  {
    color: "#eb9c36",
    scale: 1,
    rest: { x: 74, y: 74, rotate: 14 },
    delay: 0.31,
  },
  {
    color: "#d97706",
    scale: 0.95,
    rest: { x: 132, y: 34, rotate: -10 },
    delay: 0.38,
  },
  {
    color: "#92400e",
    scale: 1.05,
    rest: { x: -100, y: -18, rotate: 6 },
    delay: 0.45,
  },
  {
    color: "#f59e0b",
    scale: 0.88,
    rest: { x: 108, y: -14, rotate: -16 },
    delay: 0.52,
  },
];

const CART_BURST_DESKTOP = [
  {
    color: "#b45309",
    scale: 1,
    rest: { x: -255, y: 50, rotate: -14 },
    delay: 0.1,
  },
  {
    color: "#FFBC42",
    scale: 1.15,
    rest: { x: -162, y: 96, rotate: 10 },
    delay: 0.17,
  },
  {
    color: "#57382a",
    scale: 0.9,
    rest: { x: -48, y: 112, rotate: -6 },
    delay: 0.24,
  },
  {
    color: "#eb9c36",
    scale: 1.05,
    rest: { x: 64, y: 106, rotate: 12 },
    delay: 0.31,
  },
  {
    color: "#d97706",
    scale: 0.95,
    rest: { x: 172, y: 76, rotate: -8 },
    delay: 0.38,
  },
  {
    color: "#92400e",
    scale: 1.1,
    rest: { x: 252, y: 28, rotate: 16 },
    delay: 0.45,
  },
  {
    color: "#f59e0b",
    scale: 0.88,
    rest: { x: -210, y: -24, rotate: 4 },
    delay: 0.52,
  },
];

const SPARKLE_POSITIONS = [
  { x: -82, y: -68, delay: 0 },
  { x: 78, y: -62, delay: 0.4 },
  { x: -104, y: 16, delay: 0.8 },
  { x: 98, y: 20, delay: 1.2 },
  { x: -52, y: -98, delay: 1.6 },
  { x: 56, y: -94, delay: 2 },
  { x: -22, y: -4, delay: 1, onTop: true },
  { x: 28, y: 10, delay: 1.4, onTop: true },
];

const AVEE_SPRING = { type: "spring", stiffness: 120, damping: 14, mass: 0.9 };

function HeroSparkles({ phase, reducedMotion, layer = "behind" }) {
  if (reducedMotion) return null;

  const sparkles = SPARKLE_POSITIONS.filter((pos) =>
    layer === "front" ? pos.onTop : !pos.onTop,
  );

  return (
    <>
      {sparkles.map((pos, i) => (
        <motion.div
          key={`${layer}-${i}`}
          className={`pointer-events-none absolute left-1/2 top-1/2 ${
            layer === "front" ? "z-20" : "z-[5]"
          }`}
          style={{ translate: "-50% -50%" }}
          initial={false}
          animate={
            phase === "idle"
              ? { opacity: 1, scale: 1, x: pos.x, y: pos.y }
              : { opacity: 0, scale: 0, x: pos.x, y: pos.y }
          }
          transition={{
            opacity: {
              duration: 0.7,
              ease: "easeOut",
              delay: phase === "idle" ? 0.2 + pos.delay * 0.3 : 0,
            },
            scale: {
              duration: 0.7,
              ease: "easeOut",
              delay: phase === "idle" ? 0.2 + pos.delay * 0.3 : 0,
            },
            x: { duration: 0 },
            y: { duration: 0 },
          }}
        >
          {phase === "idle" && (
            <motion.div
              initial={{ opacity: 0.4, scale: 0.85 }}
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.85, 1.1, 0.85] }}
              transition={{
                opacity: {
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: pos.delay,
                },
                scale: {
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: pos.delay,
                },
              }}
            >
              <Sparkles
                className="h-4 w-4 text-[#FFBC42] md:h-5 md:w-5"
                strokeWidth={2.5}
              />
            </motion.div>
          )}
        </motion.div>
      ))}
    </>
  );
}

function BurstCartIcon({ entry, phase, reducedMotion, isMobile }) {
  const rest = entry.rest;
  const floatDuration = 3.2 + (entry.delay % 3) * 0.4;

  if (reducedMotion) {
    return (
      <div
        className="pointer-events-none absolute left-1/2 top-1/2"
        style={{
          transform: `translate(-50%, -50%) translate(${rest.x}px, ${rest.y}px) rotate(${rest.rotate}deg) scale(${entry.scale})`,
        }}
      >
        <ShoppingCart
          className="h-8 w-8 drop-shadow-md md:h-10 md:w-10"
          style={{ color: entry.color }}
          strokeWidth={2.25}
        />
      </div>
    );
  }

  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-1/2"
      style={{ translate: "-50% -50%" }}
      initial={{
        x: 0,
        y: isMobile ? 160 : 220,
        opacity: 0,
        scale: 0,
        rotate: 0,
      }}
      animate={
        phase === "enter"
          ? {
              x: rest.x,
              y: rest.y,
              opacity: 1,
              scale: entry.scale,
              rotate: rest.rotate,
            }
          : {
              x: rest.x,
              y: [rest.y, rest.y - 6, rest.y],
              opacity: 1,
              scale: entry.scale,
              rotate: [
                rest.rotate,
                rest.rotate + 4,
                rest.rotate - 3,
                rest.rotate,
              ],
            }
      }
      transition={
        phase === "enter"
          ? {
              ...AVEE_SPRING,
              delay: entry.delay,
            }
          : {
              y: {
                duration: floatDuration,
                repeat: Infinity,
                ease: "easeInOut",
              },
              rotate: {
                duration: floatDuration + 0.8,
                repeat: Infinity,
                ease: "easeInOut",
              },
              x: { duration: 0 },
              scale: { duration: 0 },
              opacity: { duration: 0 },
            }
      }
    >
      <ShoppingCart
        className="h-8 w-8 drop-shadow-md md:h-10 md:w-10"
        style={{ color: entry.color }}
        strokeWidth={2.25}
      />
    </motion.div>
  );
}

function HeroVisualStage({ phase, setPhase, reducedMotion }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const cartBurst = isMobile ? CART_BURST_MOBILE : CART_BURST_DESKTOP;

  useEffect(() => {
    if (reducedMotion) {
      setPhase("idle");
      return;
    }
    if (phase !== "enter") return;
    const timer = setTimeout(() => setPhase("idle"), 1500);
    return () => clearTimeout(timer);
  }, [reducedMotion, phase, setPhase]);

  return (
    <div className="relative mx-auto w-full min-h-[320px] max-w-4xl -mt-8 md:min-h-[460px]">
      <div className="absolute inset-0 flex items-center justify-center">
        <HeroSparkles
          phase={phase}
          reducedMotion={reducedMotion}
          layer="behind"
        />

        {cartBurst.map((entry, i) => (
          <BurstCartIcon
            key={i}
            entry={entry}
            phase={phase}
            reducedMotion={reducedMotion}
            isMobile={isMobile}
          />
        ))}

        {reducedMotion ? (
          <div className="relative z-10">
            <div
              className="absolute inset-0 -m-8 rounded-full bg-[#FFBC42]/25 blur-2xl md:-m-12"
              aria-hidden
            />
            <img
              src="/images/Avee.png"
              alt="Avee"
              className="relative z-10 w-36 drop-shadow-lg md:w-52"
            />
          </div>
        ) : (
          <motion.div
            className="relative z-10"
            initial={{ y: "110%", scale: 0.6, opacity: 0 }}
            animate={
              phase === "enter"
                ? { y: 0, scale: 1, opacity: 1 }
                : {
                    y: [0, -10, 0],
                    rotate: [0, 2, -2, 0],
                    scale: 1,
                    opacity: 1,
                  }
            }
            transition={
              phase === "enter"
                ? AVEE_SPRING
                : {
                    y: {
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                    rotate: {
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                    scale: { duration: 0 },
                    opacity: { duration: 0 },
                  }
            }
          >
            <div
              className="absolute inset-0 -m-8 rounded-full bg-[#FFBC42]/25 blur-2xl md:-m-12"
              aria-hidden
            />
            <img
              src="/images/Avee.png"
              alt="Avee"
              className="relative z-10 w-36 drop-shadow-lg md:w-52"
            />
          </motion.div>
        )}

        <HeroSparkles
          phase={phase}
          reducedMotion={reducedMotion}
          layer="front"
        />
      </div>
    </div>
  );
}

export default function Hero() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const [isScrolled, setIsScrolled] = useState(false);
  const [phase, setPhase] = useState(reducedMotion ? "idle" : "enter");

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 pt-24 pb-20 md:px-8 md:pt-28">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#f8f6f0] via-[#fef6eb] to-[#f8f6f0]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(255,188,66,0.16),transparent_65%)]"
        aria-hidden
      />

      <motion.div
        className="pointer-events-none absolute -left-16 top-[18%] h-48 w-48 rounded-full bg-[#FFBC42]/15 blur-3xl md:h-72 md:w-72"
        animate={
          reducedMotion
            ? undefined
            : { scale: [1, 1.08, 1], opacity: [0.5, 0.75, 0.5] }
        }
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute -right-10 bottom-[22%] h-40 w-40 rounded-full bg-[#eb9c36]/20 blur-3xl md:h-64 md:w-64"
        animate={
          reducedMotion
            ? undefined
            : { scale: [1, 1.12, 1], opacity: [0.4, 0.7, 0.4] }
        }
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-8 md:gap-10">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            ease: "easeOut",
            delay: reducedMotion ? 0 : 0.3,
          }}
          className="flex w-full flex-col items-center text-center"
        >
          <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border-2 border-black bg-white px-4 py-1.5 text-sm font-semibold shadow-[3px_3px_0_#FFBC42]">
            <Sparkles className="h-4 w-4 text-[#b45309]" strokeWidth={2.25} />
            Chrome extension turned buddy
          </span>

          <h1 className="text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl lg:text-[3.4rem]">
            Meet{" "}
            <span className="relative inline-block">
              <span className="relative z-10 font-extrabold underline decoration-[#FFBC42] decoration-[6px] underline-offset-4">
                Chaos
              </span>
              <span
                className="absolute -bottom-1 left-0 right-0 -z-0 h-3 rounded-sm bg-[#FFBC42]/40"
                aria-hidden
              />
            </span>
            ,
            <br />
            your new shopping buddy!
          </h1>

          <motion.p
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
              delay: reducedMotion ? 0 : 0.45,
            }}
            className="mt-4 max-w-md text-base leading-relaxed text-primary-dark sm:text-lg"
          >
            Making decisions has never been more fun and easy!
          </motion.p>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
              delay: reducedMotion ? 0 : 0.55,
            }}
            className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <motion.button
              whileHover={
                reducedMotion ? undefined : { rotate: -2, scale: 1.03 }
              }
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={() => navigate("/login")}
              className="rounded-full border-2 border-black bg-[var(--primary-btncolor)] px-8 py-3.5 text-base font-bold text-black shadow-[4px_4px_0_#000] transition-shadow hover:shadow-[2px_2px_0_#000] active:shadow-none sm:px-10"
            >
              Get started
            </motion.button>
            <motion.button
              whileHover={
                reducedMotion ? undefined : { rotate: 2, scale: 1.03 }
              }
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={() =>
                window.open(EXTENSION_URL, "_blank", "noopener,noreferrer")
              }
              className="rounded-full border-2 border-black bg-black px-8 py-3.5 text-base font-bold text-white shadow-[4px_4px_0_#FFBC42] transition-shadow hover:shadow-[2px_2px_0_#FFBC42] active:shadow-none sm:px-10"
            >
              Extension link
            </motion.button>
          </motion.div>
        </motion.div>

        <HeroVisualStage
          phase={phase}
          setPhase={setPhase}
          reducedMotion={reducedMotion}
        />
      </div>

      <AnimatePresence>
        {!isScrolled && (
          <motion.div
            key="scroll-entice"
            initial={{ opacity: 0, y: 16 }}
            animate={{
              opacity: 1,
              y: [0, -6, 0],
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
              rotate: 7,
              transition: { duration: 0.6, ease: "circOut" },
            }}
            transition={{
              opacity: { duration: 0.5, delay: reducedMotion ? 0.5 : 2.5 },
              y: {
                duration: 2,
                ease: "easeInOut",
                delay: reducedMotion ? 0.8 : 3,
                repeat: Infinity,
                repeatType: "loop",
              },
            }}
            className="pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-primary-dark"
          >
            <span className="rounded-full border border-stone-300/80 bg-white/70 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-sm">
              Cool stuff below!!
            </span>
            <ChevronsDown className="h-6 w-6 opacity-80" strokeWidth={2.5} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
