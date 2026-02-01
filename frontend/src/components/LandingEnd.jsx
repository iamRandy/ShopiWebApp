import { AnimatePresence, motion, useInView } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LandingEnd() {
    const navigate = useNavigate();
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 });

    const [showSecond, setShowSecond] = useState(false);

    useEffect(() => {
        if (!isInView) return;

        const timer = setTimeout(() => {
            setShowSecond(true);
        }, 2500);

        return () => clearTimeout(timer);
    }, [isInView]);

    return (
        <section ref={ref} id="landing-end" className=" md:h-screen flex justify-center items-center relative mb-48">
            <div className="flex flex-col items-center justify-center text-black p-5 h-100">
                <h2 className="text-2xl font-bold text-center mb-20">
                    <AnimatePresence mode="wait">
                        {!showSecond && (
                            <motion.span
                                key="first"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ duration: 0.4 }}
                                className="inline-block"
                            >
                                Still thinking about it?
                            </motion.span>
                        )}

                        {showSecond && (
                            <motion.span
                                key="second"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4 }}
                                className="inline-block"
                            >
                                Try Chaos for yourself!
                            </motion.span>
                        )}
                    </AnimatePresence>
                </h2>

                <div className="w-[14rem] h-[14rem] rounded-full bg-[var(--primary-btncolor-shadow)]
                z-30">
                    <motion.button 
                    initial={{ x: 0, y: 0 }}
                    whileInView={{ x: 10, y: -10 }}
                    whileHover={{ x: 14, y: -14 }}
                    whileTap={{ x: 0, y: 0, transition: { ease: "easeIn", duration: .05 } }}
                    style={{borderRadius: "50%", fontSize: "2em", color: "white", fontWeight: "bold"}} 
                    onClick={() => navigate("/login")}
                    className="popup_button w-full h-full border-none cursor-pointer 
                    bg-[var(--primary-btncolor)]">
                        START
                    </motion.button>
                </div>
            </div>

            <div style={{ fontWeight: "bolder" }}>
                <motion.div
                initial={{ x: -120 }} 
                whileInView={{ x: 70 }}
                transition={{ duration: .8, ease: "backInOut" }}
                className="absolute left-0 top-80 -rotate-12 md:bottom-28 hidden md:inline">
                    <small>
                        - Wow it's so easy to use!
                    </small>
                </motion.div>

                <motion.div
                initial={{ x: -120 }} 
                whileInView={{ x: 30 }}
                transition={{ duration: .8, ease: "backInOut" }}
                className="absolute left-0 top-3/5  -rotate-3 md:bottom-28 hidden md:inline">
                    <small>
                        - 10/10 would recommend.
                    </small>
                </motion.div>
                        
                <motion.div
                initial={{ x: -120 }} 
                whileInView={{ x: 20 }}
                transition={{ duration: .8, ease: "backInOut" }}
                className="absolute left-0 -bottom-5 rotate-12 md:bottom-28">
                    <small>
                        - pssstttt, did we mention that it's totally free!
                    </small>
                </motion.div>
            </div>

            <div 
            className="w-2/3 h-2/3 absolute -top-44 -right-40 -rotate-90
            md:w-2/3 md:h-2/3 md:top-0 md:-right-[22rem]">
                <img src="\images\Avee.png"></img>
            </div>
        </section>
    );
}