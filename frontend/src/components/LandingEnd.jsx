import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const QUOTES = [
  {
    text: "Wow, it's so easy to use!",
    author: "Happy shopper",
    rotate: "-rotate-6",
    position: "left-[4%] top-[0%] md:left-[7%] md:top-[18%]",
    hideOnMobile: false,
  },
  {
    text: "10/10 would recommend.",
    author: "Cart collector",
    rotate: "rotate-3",
    position: "right-[6%] top-[0%] md:right-[7%] md:top-[20%]",
    hideOnMobile: false,
  },
  {
    text: "Pssst… it's totally free!",
    author: "Your wallet",
    rotate: "-rotate-2",
    position: "left-[10%] bottom-[0%] md:left-[14%] md:bottom-[32%]",
    hideOnMobile: false,
  },
  {
    text: "I finally stopped losing links.",
    author: "Tab hoarder",
    rotate: "rotate-6",
    position: "right-[8%] bottom-[0%] md:right-[10%] md:bottom-[28%]",
    hideOnMobile: false,
  },
];

function QuoteBubble({ quote, opacity, scale, y }) {
  return (
    <motion.div
      style={{ opacity, scale, y }}
      className={`absolute max-w-[11rem] sm:max-w-[13rem] ${quote.position} ${quote.rotate} z-20 ${quote.hideOnMobile ? "hidden sm:block" : ""}`}
    >
      <div className="rounded-2xl border-2 border-black bg-white px-4 py-3 shadow-[5px_5px_0_#FFBC42]">
        <p className="text-sm font-semibold leading-snug text-black">
          &ldquo;{quote.text}&rdquo;
        </p>
        <p className="mt-1 text-xs font-medium text-[#b45309]">— {quote.author}</p>
      </div>
      <div
        className={`absolute -bottom-2 h-4 w-4 rotate-45 border-b-2 border-r-2 border-black bg-white ${
          quote.position.includes("right") ? "right-6" : "left-6"
        }`}
        aria-hidden
      />
    </motion.div>
  );
}

export default function LandingEnd() {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const [isStartHovered, setIsStartHovered] = useState(false);
  const [canHoverDesktop, setCanHoverDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px) and (hover: hover)");
    const update = () => setCanHoverDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "center center"],
  });

  const headlineOpacity = useTransform(scrollYProgress, [0, 0.35, 0.55], [0, 0.5, 1]);
  const headlineY = useTransform(scrollYProgress, [0, 0.35, 0.55], [40, 20, 0]);
  const subOpacity = useTransform(scrollYProgress, [0.2, 0.45, 0.65], [0, 0.4, 1]);
  const buttonScale = useTransform(scrollYProgress, [0.35, 0.6, 0.8], [0.85, 0.95, 1]);
  const buttonOpacity = useTransform(scrollYProgress, [0.3, 0.55, 0.75], [0, 0.6, 1]);
  const quoteReveal = useTransform(scrollYProgress, [0.15, 0.55], [0, 1]);
  const quoteScale = useTransform(quoteReveal, [0, 1], [0.9, 1]);
  const quoteY = useTransform(quoteReveal, [0, 1], [24, 0]);
  const aveeOpacity = useTransform(scrollYProgress, [0.4, 0.75], [0, 1]);
  const aveeY = useTransform(scrollYProgress, [0.4, 0.75], [36, 0]);

  const startHovered = isStartHovered && canHoverDesktop;

  return (
    <section
      ref={sectionRef}
      id="landing-end"
      className="relative min-h-[110vh] overflow-hidden pb-12 pt-16 md:min-h-screen md:pb-16"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(255,188,66,0.35),transparent_70%)]"
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute -left-20 top-1/4 h-56 w-56 rounded-full bg-[#FFBC42]/20 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute -right-16 bottom-1/4 h-64 w-64 rounded-full bg-[#FFBC42]/15 blur-3xl"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.55, 0.3] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[85vh] max-w-5xl flex-col items-center justify-center px-5">
        {QUOTES.map((quote) => (
          <QuoteBubble
            key={quote.text}
            quote={quote}
            opacity={quoteReveal}
            scale={quoteScale}
            y={quoteY}
          />
        ))}

        <motion.div
          className="relative z-30 flex max-w-lg flex-col items-center text-center"
          style={{ opacity: headlineOpacity, y: headlineY }}
        >
          <motion.div
            className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-black bg-white/90 px-4 py-1.5 text-sm font-semibold shadow-[3px_3px_0_#000]"
            style={{ opacity: subOpacity }}
          >
            <Sparkles className="h-4 w-4 text-[#FFBC42]" strokeWidth={2.5} />
            No credit card required
          </motion.div>

          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-black sm:text-4xl md:text-5xl">
            Still juggling tabs?
            <br />
            <span className="underline decoration-[#FFBC42] decoration-4 underline-offset-4">
              Let&apos;s fix that.
            </span>
          </h2>

          <motion.p
            className="mt-4 text-base text-primary-dark sm:text-lg"
            style={{ opacity: subOpacity }}
          >
            One click to save anything. One place to find it later. Your future
            self will thank you.
          </motion.p>
        </motion.div>

        <motion.div
          className="relative z-40 mt-12"
          style={{ opacity: buttonOpacity, scale: buttonScale }}
          onMouseEnter={() => canHoverDesktop && setIsStartHovered(true)}
          onMouseLeave={() => setIsStartHovered(false)}
        >
          <div
            className={`relative h-[14rem] w-[14rem] rounded-full bg-[var(--primary-btncolor-shadow)] transition-shadow duration-300 ${
              startHovered
                ? "shadow-[0_0_24px_rgba(255,188,66,0.28),0_0_48px_rgba(255,160,40,0.12)]"
                : ""
            }`}
          >
            {startHovered && (
              <div
                className="pointer-events-none absolute inset-0 animate-pulse rounded-full ring-2 ring-[#FFBC42]/20"
                aria-hidden
              />
            )}
            <motion.button
              type="button"
              initial={{ x: 0, y: 0 }}
              whileInView={{ x: 10, y: -10 }}
              whileHover={
                canHoverDesktop ? { x: 14, y: -14 } : undefined
              }
              whileTap={{ x: 0, y: 0, transition: { ease: "easeIn", duration: 0.05 } }}
              style={{
                borderRadius: "50%",
                fontSize: "2em",
                color: "white",
                fontWeight: "bold",
              }}
              onClick={() => navigate("/login")}
              className={`popup_button relative z-10 h-full w-full cursor-pointer border-none bg-[var(--primary-btncolor)] transition-shadow duration-300 ${
                startHovered
                  ? "shadow-[0_0_16px_rgba(255,188,66,0.35)]"
                  : ""
              }`}
            >
              START
            </motion.button>
          </div>
        </motion.div>

        <motion.p
          className="relative z-30 mt-8 text-center text-sm font-medium text-stone-600"
          style={{ opacity: subOpacity }}
        >
          Join the shoppers who stopped losing great finds.
        </motion.p>
      </div>

      <motion.div
        className="pointer-events-none absolute -bottom-8 right-0 z-10 w-40 sm:w-52 md:-right-4 md:w-64"
        style={{ opacity: aveeOpacity, y: aveeY }}
      >
        <motion.div
          className="will-change-transform"
          animate={
            startHovered
              ? { y: [0, -14, 0] }
              : { rotate: [0, 4, -2, 0], y: 0 }
          }
          transition={
            startHovered
              ? { duration: 0.55, repeat: Infinity, ease: "easeInOut" }
              : { duration: 5, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <img src="/images/Avee.png" alt="" className="w-full drop-shadow-lg" />
        </motion.div>
      </motion.div>
    </section>
  );
}
