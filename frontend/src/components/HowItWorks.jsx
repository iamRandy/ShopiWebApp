import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { useRef, useState } from "react";

const SELLING_POINTS = [
  {
    id: 1,
    image: "/images/createcart.png",
    title: "Any Store",
    subtitle: "Go to any website and save!",
  },
  {
    id: 2,
    image: "/images/yourcarts.png",
    title: "One Place",
    subtitle: "Guaranteed lost proof!",
  },
  {
    id: 3,
    image: "/images/itemview.png",
    title: "Super Easy",
    subtitle: "Skill requirement: NONE!",
  },
];

function SellingPointCard({ point, opacity, y, canHover }) {
  return (
    <motion.div style={{ opacity, y }} layout={false} className="relative mb-3">
      <div
        className={`transform-gpu rounded-md bg-cover bg-center h-100 w-100 border-2 border-black shadow-[6px_6px_0_#000] transition-transform duration-200 ease-out ${
          canHover
            ? "hover:scale-105 hover:-translate-y-2 hover:z-[100] relative"
            : ""
        }`}
        style={{
          backgroundImage: `url('${point.image}')`,
          imageRendering: "auto",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-2">
        <div className="w-full rounded-sm bg-white py-2.5 px-3 text-center shadow-sm antialiased">
          <p className="text-base font-bold">{point.title}</p>
          <p className="text-sm text-primary-dark">{point.subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function HowItWorks() {
  const sectionRef = useRef(null);
  const [canHover, setCanHover] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start center", "center end"],
  });

  const headingOpacity = useTransform(scrollYProgress, [0, 0.12, 0.22], [0, 0.4, 1]);
  const headingY = useTransform(scrollYProgress, [0, 0.12, 0.22], [48, 24, 0]);

  const card0Opacity = useTransform(scrollYProgress, [0.18, 0.28, 0.34], [0, 0.35, 1]);
  const card0Y = useTransform(scrollYProgress, [0.18, 0.28, 0.34], [48, 24, 0]);

  const card1Opacity = useTransform(scrollYProgress, [0.38, 0.48, 0.54], [0, 0.35, 1]);
  const card1Y = useTransform(scrollYProgress, [0.38, 0.48, 0.54], [48, 24, 0]);

  const card2Opacity = useTransform(scrollYProgress, [0.58, 0.68, 0.74], [0, 0.35, 1]);
  const card2Y = useTransform(scrollYProgress, [0.58, 0.68, 0.74], [48, 24, 0]);

  const cards = [
    { opacity: card0Opacity, y: card0Y },
    { opacity: card1Opacity, y: card1Y },
    { opacity: card2Opacity, y: card2Y },
  ];

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setCanHover(v > 0.74);
  });

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative h-[180vh] bg-gradient-to-b from-[var(--primary-bgcolor)] to-[rgba(255,234,207,0)]"
    >
      <div className="sticky top-0 flex h-screen items-center justify-center p-5">
        <div className="w-full max-w-6xl">
          <motion.div
            layout={false}
            style={{ opacity: headingOpacity, y: headingY }}
            className="mb-10 text-center md:mb-16"
          >
            <h2 className="text-4xl font-bold md:text-5xl">
              Why should I use Chaos?
            </h2>
            <p className="text-primary-dark mx-auto mt-3 max-w-xl text-lg">
              Chaos is built to make even the most complex shopping decisions,
              easier.
            </p>
          </motion.div>

          <div className="grid max-[768px]:grid-cols-1 max-[1210px]:grid-cols-2 min-[1210px]:grid-cols-3 place-items-center justify-center gap-6">
            {SELLING_POINTS.map((point, index) => (
              <SellingPointCard
                key={point.id}
                point={point}
                opacity={cards[index].opacity}
                y={cards[index].y}
                canHover={canHover}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
