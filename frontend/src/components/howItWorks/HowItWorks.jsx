import { memo } from "react";
import {
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef, useEffect, useState } from "react";
import SectionHeader from "./SectionHeader";
import SectionBackground from "./SectionBackground";
import FloatingSparkles from "./FloatingSparkles";
import CardsBackdrop from "./CardsBackdrop";
import { SELLING_POINTS } from "./constants";

const SellingPointCard = memo(function SellingPointCard({
  point,
  index,
  opacity,
  y,
  animateOnView = false,
}) {
  const Icon = point.icon;
  const Demo = point.Demo;

  const card = (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 border-black bg-gradient-to-br ${point.accent} p-3 shadow-[6px_6px_0_#FFBC42] transition-shadow duration-300 group-hover:shadow-[8px_10px_0_#FFBC42]`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_#000]">
          <Icon className="h-4 w-4 text-[#b45309]" strokeWidth={2.25} />
        </span>
        <span className="rounded-full border-2 border-black bg-[#FFBC42] px-2.5 py-0.5 text-xs font-extrabold tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border-2 border-black bg-white shadow-[3px_3px_0_rgba(0,0,0,0.15)]">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-stone-50 [contain:paint]">
          <div className="absolute inset-0 overflow-hidden">
            <Demo />
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border-2 border-black bg-white/95 px-3 py-2.5 text-center">
        <h3 className="text-base font-bold tracking-tight">{point.title}</h3>
        <p className="mt-0.5 text-sm font-medium text-primary-dark">
          {point.subtitle}
        </p>
      </div>
    </div>
  );

  if (animateOnView) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className={`group relative z-10 w-full max-w-[19rem] ${point.tilt}`}
      >
        {card}
      </motion.article>
    );
  }

  return (
    <motion.article
      style={{ opacity, y }}
      className={`group relative z-10 w-full max-w-[19rem] ${point.tilt} transition-transform duration-500 ease-out hover:rotate-0 hover:-translate-y-2 hover:z-30`}
    >
      {card}
    </motion.article>
  );
});

function CardsStage({ children }) {
  return (
    <div className="relative mx-auto w-full max-w-5xl px-2 py-6 [contain:layout] sm:px-4 sm:py-8">
      <CardsBackdrop />
      <FloatingSparkles />
      {children}
    </div>
  );
}

function MobileHowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-gradient-to-b from-[var(--primary-bgcolor)] via-[#fff8ee] to-[rgba(255,234,207,0)] px-5 py-20"
    >
      <SectionBackground />
      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <SectionHeader className="mb-10" />
        <CardsStage>
          <div className="relative z-10 mx-auto flex flex-col items-center gap-8">
            {SELLING_POINTS.map((point, index) => (
              <SellingPointCard
                key={point.id}
                point={point}
                index={index}
                animateOnView
              />
            ))}
          </div>
        </CardsStage>
      </div>
    </section>
  );
}

function DesktopHowItWorks() {
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.35", "center end"],
  });

  const headingOpacity = useTransform(
    scrollYProgress,
    [0.06, 0.2, 0.34],
    [0, 0.4, 1]
  );
  const headingY = useTransform(scrollYProgress, [0.06, 0.2, 0.34], [48, 24, 0]);

  const card0Opacity = useTransform(
    scrollYProgress,
    [0.12, 0.26, 0.42, 0.5],
    [0, 0.12, 0.65, 1]
  );
  const card0Y = useTransform(
    scrollYProgress,
    [0.12, 0.26, 0.42, 0.5],
    [56, 40, 12, 0]
  );

  const card1Opacity = useTransform(
    scrollYProgress,
    [0.48, 0.62, 0.78, 0.86],
    [0, 0.12, 0.65, 1]
  );
  const card1Y = useTransform(
    scrollYProgress,
    [0.48, 0.62, 0.78, 0.86],
    [56, 40, 12, 0]
  );

  const card2Opacity = useTransform(
    scrollYProgress,
    [0.84, 0.92, 0.98, 1],
    [0, 0.12, 0.65, 1]
  );
  const card2Y = useTransform(
    scrollYProgress,
    [0.84, 0.92, 0.98, 1],
    [56, 40, 12, 0]
  );

  const cards = [
    { opacity: card0Opacity, y: card0Y },
    { opacity: card1Opacity, y: card1Y },
    { opacity: card2Opacity, y: card2Y },
  ];

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative h-[160vh] overflow-hidden bg-gradient-to-b from-[var(--primary-bgcolor)] via-[#fff8ee] to-[rgba(255,234,207,0)] pt-52 [content-visibility:auto] md:pt-64"
    >
      <SectionBackground />

      <div className="sticky top-0 flex h-screen flex-col items-center justify-start p-5 pt-10 [transform:translateZ(0)] md:justify-center md:pt-10">
        <div className="relative z-10 w-full max-w-6xl shrink-0">
          <motion.header
            style={{ opacity: headingOpacity, y: headingY }}
            className="mb-10 text-center md:mb-14"
          >
            <SectionHeader />
          </motion.header>

          <CardsStage>
            <div className="relative z-10 mx-auto grid grid-cols-1 place-items-center gap-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7">
              {SELLING_POINTS.map((point, index) => (
                <SellingPointCard
                  key={point.id}
                  point={point}
                  index={index}
                  opacity={cards[index].opacity}
                  y={cards[index].y}
                />
              ))}
            </div>
          </CardsStage>
        </div>
      </div>
    </section>
  );
}

export default function HowItWorks() {
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isMobile ? <MobileHowItWorks /> : <DesktopHowItWorks />;
}
