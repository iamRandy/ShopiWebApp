import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function Hero() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const transition = {
    duration: 1,
    ease: "easeInOut",
  };

  return (
    <section className="min-h-screen flex items-center justify-between text-center">
      <motion.div
        animate={{
          translateY: ["20px", "-20px", "20px"],
          rotate: [5, -5, 5],
        }}
        transition={{
          duration: 5,
          ease: "easeInOut",
          repeat: Infinity,
        }}
        className="px-6 w-full"
      >
        <img src="/images/Avee.png" alt="Avee" className="w-1/3 mx-auto" />
      </motion.div>

      <div className="flex flex-col justify-start px-2 w-full">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={transition}
          className="text-3xl md:text-4xl font-bold mb-4 text-start w-3/4"
        >
          Meet Chaos, your new online shopping assistant.
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={transition}
          className="text-start text-stone-400"
        >
          Making decisions doesn't have to be so hard.
        </motion.h2>

        <div className="mt-5 flex justify-start">
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4, ease: "easeInOut", delay: 2 }}
            onClick={() => navigate("/login")}
            className="px-8 py-4 bg-[#FFBC42] hover:bg-[#f7ad3e] text-white font-bold rounded-full text-lg shadow-lg"
          >
            GET STARTED
          </motion.button>
        </div>
        {!isScrolled && (
          <motion.div
            initial={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut", delay: 10 }}
            className="absolute bottom-10 left-0 w-full text-center mt-12"
          >
            <p className="text-gray-500 font-bold">Wanna closer look?</p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
