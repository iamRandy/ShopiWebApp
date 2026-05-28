import {

  motion,

  useScroll,

  useTransform,

  useMotionValueEvent,

} from "framer-motion";

import { Globe, Layers, Sparkles } from "lucide-react";

import { useRef, useState, useEffect } from "react";



const SELLING_POINTS = [

  {

    id: 1,

    image: "/images/createcart.png",

    title: "Any Store",

    subtitle: "Go to any website and save!",

    icon: Globe,

    accent: "from-amber-100 to-orange-50",

    tilt: "-rotate-2",

  },

  {

    id: 2,

    image: "/images/yourcarts.png",

    title: "One Place",

    subtitle: "Guaranteed lost proof!",

    icon: Layers,

    accent: "from-yellow-50 to-amber-100",

    tilt: "rotate-1",

  },

  {

    id: 3,

    image: "/images/itemview.png",

    title: "Super Easy",

    subtitle: "Skill requirement: NONE!",

    icon: Sparkles,

    accent: "from-orange-50 to-amber-50",

    tilt: "rotate-2",

  },

];



function SectionBackground() {

  return (

    <>

      <div

        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_30%,rgba(255,188,66,0.22),transparent_65%)]"

        aria-hidden

      />

      <div
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(#d4a574_1px,transparent_1px)] [background-size:20px_20px] [mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.2)_14%,rgba(0,0,0,0.75)_38%,rgba(0,0,0,0.9)_50%,rgba(0,0,0,0.75)_62%,rgba(0,0,0,0.2)_86%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.2)_14%,rgba(0,0,0,0.75)_38%,rgba(0,0,0,0.9)_50%,rgba(0,0,0,0.75)_62%,rgba(0,0,0,0.2)_86%,transparent_100%)]"
        aria-hidden
      />

      <motion.div

        className="pointer-events-none absolute -left-24 top-1/3 h-48 w-48 rounded-full bg-[#FFBC42]/25 blur-3xl"

        animate={{ y: [0, 18, 0], scale: [1, 1.08, 1] }}

        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}

        aria-hidden

      />

      <motion.div

        className="pointer-events-none absolute -right-20 bottom-1/4 h-56 w-56 rounded-full bg-[#FFBC42]/20 blur-3xl"

        animate={{ y: [0, -14, 0], scale: [1.05, 1, 1.05] }}

        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}

        aria-hidden

      />

    </>

  );

}



function SectionHeader({ className = "" }) {

  return (

    <header className={`text-center ${className}`}>

      <span className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-black bg-white px-4 py-1.5 text-sm font-semibold shadow-[3px_3px_0_#FFBC42]">

        <Sparkles className="h-4 w-4 text-[#b45309]" />

        3 reasons you&apos;ll love it

      </span>

      <h2 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">

        Why should I use{" "}

        <span className="relative inline-block">

          <span className="relative z-10 font-extrabold underline decoration-[#FFBC42] decoration-[6px] underline-offset-4">

            Chaos

          </span>

          <span

            className="absolute -bottom-1 left-0 right-0 -z-0 h-3 rounded-sm bg-[#FFBC42]/40"

            aria-hidden

          />

        </span>

        ?

      </h2>

      <p className="text-primary-dark mx-auto mt-4 max-w-lg text-base leading-relaxed sm:text-lg">

        Chaos turns messy tabs and forgotten links into one happy, organized

        place — no spreadsheet required.

      </p>

    </header>

  );

}



function SellingPointCard({

  point,

  index,

  opacity,

  y,

  canHover,

  animateOnView = false,

}) {

  const Icon = point.icon;



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

        <img

          src={point.image}

          alt={point.title}

          className="aspect-[4/5] w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"

          loading="lazy"

        />

      </div>



      <div className="mt-3 rounded-xl border-2 border-black bg-white/95 px-3 py-2.5 text-center backdrop-blur-sm">

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

        className={`group relative w-full max-w-[19rem] ${point.tilt}`}

      >

        {card}

      </motion.article>

    );

  }



  return (

    <motion.article

      style={{ opacity, y }}

      layout={false}

      className={`group relative w-full max-w-[19rem] ${point.tilt} transition-transform duration-500 ease-out ${

        canHover ? "hover:rotate-0 hover:-translate-y-2 hover:z-20" : ""

      }`}

    >

      {card}

    </motion.article>

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

        <div className="mx-auto flex max-w-5xl flex-col items-center gap-8">

          {SELLING_POINTS.map((point, index) => (

            <SellingPointCard

              key={point.id}

              point={point}

              index={index}

              animateOnView

            />

          ))}

        </div>

      </div>

    </section>

  );

}



function DesktopHowItWorks() {

  const sectionRef = useRef(null);

  const [canHover, setCanHover] = useState(false);



  const { scrollYProgress } = useScroll({

    target: sectionRef,

    offset: ["start 0.35", "center end"],

  });



  const headingOpacity = useTransform(

    scrollYProgress,

    [0.06, 0.2, 0.34],

    [0, 0.4, 1],

  );

  const headingY = useTransform(scrollYProgress, [0.06, 0.2, 0.34], [48, 24, 0]);



  const card0Opacity = useTransform(

    scrollYProgress,

    [0.12, 0.26, 0.42, 0.5],

    [0, 0.12, 0.65, 1],

  );

  const card0Y = useTransform(

    scrollYProgress,

    [0.12, 0.26, 0.42, 0.5],

    [56, 40, 12, 0],

  );



  const card1Opacity = useTransform(

    scrollYProgress,

    [0.48, 0.62, 0.78, 0.86],

    [0, 0.12, 0.65, 1],

  );

  const card1Y = useTransform(

    scrollYProgress,

    [0.48, 0.62, 0.78, 0.86],

    [56, 40, 12, 0],

  );



  const card2Opacity = useTransform(

    scrollYProgress,

    [0.84, 0.92, 0.98, 1],

    [0, 0.12, 0.65, 1],

  );

  const card2Y = useTransform(

    scrollYProgress,

    [0.84, 0.92, 0.98, 1],

    [56, 40, 12, 0],

  );



  const cards = [

    { opacity: card0Opacity, y: card0Y },

    { opacity: card1Opacity, y: card1Y },

    { opacity: card2Opacity, y: card2Y },

  ];



  useMotionValueEvent(scrollYProgress, "change", (v) => {

    setCanHover(v > 0.92);

  });



  return (

    <section

      ref={sectionRef}

      id="how-it-works"

      className="relative h-[180vh] overflow-hidden bg-gradient-to-b from-[var(--primary-bgcolor)] via-[#fff8ee] to-[rgba(255,234,207,0)] pt-52 md:pt-64"

    >

      <SectionBackground />



      <div className="sticky top-0 flex h-screen flex-col items-center justify-start overflow-y-auto p-5 pt-10 md:justify-center md:overflow-visible md:pt-10">

        <div className="relative z-10 w-full max-w-6xl shrink-0">

          <motion.header

            layout={false}

            style={{ opacity: headingOpacity, y: headingY }}

            className="mb-10 text-center md:mb-14"

          >

            <SectionHeader />

          </motion.header>



          <div className="mx-auto grid max-w-5xl grid-cols-1 place-items-center gap-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7">

            {SELLING_POINTS.map((point, index) => (

              <SellingPointCard

                key={point.id}

                point={point}

                index={index}

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



export default function HowItWorks() {

  const [isMobile, setIsMobile] = useState(

    () =>

      typeof window !== "undefined" &&

      window.matchMedia("(max-width: 767px)").matches,

  );



  useEffect(() => {

    const mq = window.matchMedia("(max-width: 767px)");

    const onChange = (e) => setIsMobile(e.matches);

    mq.addEventListener("change", onChange);

    return () => mq.removeEventListener("change", onChange);

  }, []);



  return isMobile ? <MobileHowItWorks /> : <DesktopHowItWorks />;

}


