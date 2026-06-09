import { motion } from "framer-motion";
import { Bookmark } from "lucide-react";

const LINE_GRID_STYLE = {
  backgroundImage: `
    linear-gradient(to right, rgba(160, 120, 70, 0.26) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(160, 120, 70, 0.26) 1px, transparent 1px)
  `,
  backgroundSize: "28px 28px",
  maskImage:
    "radial-gradient(ellipse 74% 70% at 50% 50%, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.45) 36%, rgba(0,0,0,0.7) 56%, transparent 88%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 74% 70% at 50% 50%, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.45) 36%, rgba(0,0,0,0.7) 56%, transparent 88%)",
};

function FloatingCube({ className, xDuration = 8, rotateDuration = 9, delay = 0 }) {
  return (
    <motion.div
      className={`absolute -z-10 h-32 w-32 rounded-xl bg-[#FFBC42] opacity-20 md:h-[200px] md:w-[200px] md:opacity-25 ${className}`}
      animate={{
        x: ["-15vw", "115vw"],
        rotate: [0, 360],
      }}
      transition={{
        x: {
          duration: xDuration,
          repeat: Infinity,
          ease: "linear",
          delay,
          repeatDelay: 0,
        },
        rotate: {
          duration: rotateDuration,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 0,
        },
      }}
    />
  );
}

function GifWithLineGrid({ children }) {
  return (
    <div className="relative flex min-h-[18rem] w-full justify-center py-6 md:min-h-[24rem] md:py-8">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[min(260%,42rem)] w-[min(300%,52rem)] max-h-[min(44rem,75vh)] max-w-[min(64rem,92vw)] -translate-x-1/2 -translate-y-1/2 md:h-[min(280%,46rem)] md:w-[min(320%,60rem)]"
        style={LINE_GRID_STYLE}
        aria-hidden
      />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}

export default function Features() {
  return (
    <section
      id="features"
      className="relative z-0 -mt-24 flex min-h-screen items-center justify-center overflow-hidden px-5 pb-16 pt-36 md:px-8 md:pb-20 md:pt-44"
    >
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[75%] bg-gradient-to-b from-transparent via-[#fff8ee]/60 to-[rgba(255,234,207,1)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_75%,rgba(255,188,66,0.12),transparent_70%)]"
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block">
        <FloatingCube className="top-[18%]" xDuration={7} rotateDuration={8} />
        <FloatingCube
          className="top-[55%]"
          xDuration={9}
          rotateDuration={10}
          delay={2.5}
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-10 md:flex-row md:items-center md:gap-14 lg:gap-16">
        <motion.div
          initial={{ translateY: 20, opacity: 0 }}
          whileInView={{ translateY: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeInOut", delay: 0.2 }}
          className="shrink-0 text-center md:max-w-md md:text-left"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-black bg-white px-4 py-1.5 text-sm font-semibold shadow-[3px_3px_0_#FFBC42]">
            <Bookmark className="h-4 w-4 text-[#b45309]" strokeWidth={2.25} />
            Save from anywhere
          </span>
          <h2 className="text-4xl font-bold md:text-5xl">Just save it!</h2>
          <p className="text-primary-dark mx-auto mt-4 max-w-md text-lg leading-relaxed md:mx-0">
            Found something you love? Save it now and decide later.
          </p>
        </motion.div>

        <motion.div
          initial={{ translateY: 20, opacity: 0, rotateZ: 4 }}
          whileInView={{ translateY: 0, opacity: 1, rotateZ: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeInOut", delay: 0.25 }}
          className="w-full max-w-lg md:max-w-2xl md:flex-1"
        >
          <GifWithLineGrid>
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ duration: 0.25 }}
              className="group relative mx-auto w-full"
            >
              <div className="overflow-hidden rounded-2xl border-2 border-black bg-white p-2.5 shadow-[6px_6px_0_#FFBC42] transition-shadow duration-300 group-hover:shadow-[8px_10px_0_#FFBC42] md:p-3">
                <div className="relative overflow-hidden rounded-xl border-2 border-black">
                  <img
                    className="aspect-video w-full object-cover"
                    src="/videos/SaveAndViewCart.gif"
                    alt="Chaos extension saving a product to a cart"
                  />
                </div>
              </div>
            </motion.div>
          </GifWithLineGrid>
        </motion.div>
      </div>
    </section>
  );
}
