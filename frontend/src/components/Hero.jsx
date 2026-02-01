import { ChevronsDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
    <section className="relative flex h-screen flex-col items-center justify-end text-center pb-20 px-5 md:flex-row md:justify-between">
      {/* Logo */}
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
        className="px-6 w-full mb-11 md:mb-0"
      >
        <img src="/images/Avee.png" alt="Avee" className="w-40 md:w-1/3 mx-auto" />
      </motion.div>

      {/* Phrase */}
      <div className="flex flex-col justify-start text-start w-full mb-20 md:m-0">
        <div className="text-2xl font-bold md:text-4xl">
          Meet{" "}
          <span className="font-extrabold underline decoration-[#FFBC42]">
            Chaos
          </span>
          ,
          <br />
          your new shopping buddy!
        </div>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={transition}
          className="text-start text-primary-dark mt-2"
        >
          Making decisions has never been more fun and easy!
        </motion.h2>

        <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeInOut", delay: 1.5 }}
        className="mt-5 flex justify-center md:justify-start"
        >
          <motion.button
            whileHover={{ rotate: 4, scale: 1.1,
              transition: 0.1
            }}
            transition={{ duration: 0.35 }}
            onClick={() => navigate("/login")}
            className="px-16 py-4 bg-[var(--primary-btncolor)] text-white font-bold rounded-full text-lg shadow-lg"
          >
            GET STARTED
          </motion.button>
        </motion.div>
      </div>
      <AnimatePresence>
        {!isScrolled && (
          <motion.div
            key="scroll-entice"
            initial={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: [0, -5, 0] }}
            exit={{ opacity: 0, scale: 0.9, rotate: 7, ease: "circOut", transition: { duration: 1 } }}
            transition={{ 
              default: {
                duration: 0.4,
                ease: "easeInOut",
                delay: 3.5,
              },
              translateY: {
                duration: 2, 
                ease: "easeInOut", 
                delay: 1,
                repeat: Infinity,
                repeatType: "loop"
              }
            }}
            className="absolute text-center h-[100vh] w-[100vw] mt-12 text-primary-dark flex flex-col justify-end items-center pointer-events-none"
          >
            <p className="font-bold">Cool stuff below!!</p>
            <ChevronsDown className="w-[28px] h-[28px]" />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
