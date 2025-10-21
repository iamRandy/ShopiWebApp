import { motion, AnimatePresence, easeInOut } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function Features() {
    const [flyDistance, setFlyDistance] = useState(-window.innerWidth - 200);
    const [animationData, setAnimationData] = useState(null);

    useEffect(() => {
        const handleResize = () => {
            console.log("SCREEN RESIZED!");
            setFlyDistance(-window.innerWidth - 200);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        fetch('/lotties/shoppingLottie.json')
            .then(response => response.json())
            .then(data => setAnimationData(data));
    }, []);

    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: animationData,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice'
        }
    };

    return (
        <section id="features" className="relative h-screen flex items-center justify-center text-left z-0 bg-[#ffeacf] p-5 md:p-0">
            
            {/* Animated cubes */}
            <div>
                <motion.div 
                initial={{ translateX: 200, rotate: 120 }}
                animate={{ translateX: flyDistance, rotate: 360 }}
                transition={{ duration: 10, ease: "linear", repeat: Infinity, repeatDelay: 4 }}
                className="absolute translate-x-full right-0 bottom-0 -z-10 h-[200px] w-[200px] bg-[#FFBC42] opacity-25 rounded-xl" 
                />
                
                <motion.div 
                initial={{ translateX: 200, rotate: 0 }}
                animate={{ translateX: flyDistance, rotate: 270 }}
                transition={{ delay: 8, duration: 12, ease: "linear", repeat: Infinity, repeatDelay: 9 }}
                className="absolute translate-x-full right-0 top-0 -z-10 h-[200px] w-[200px] bg-[#FFBC42] opacity-25 rounded-xl" 
                />
            </div>

            {/* Content */}
            <div className="h-full md:flex-row md:justify-between flex flex-col justify-center items-center gap-5 md:gap-10">
                <motion.div
                initial={{ translateY: 20, opacity: 0 }}
                whileInView={{ translateY: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeInOut", delay: 0.2 }}
                >
                    <h2 className="text-4xl font-bold">Just save it!</h2>
                    <p className="text-[#b98626] mt-4 max-w-1xl mx-auto">
                        Found something you love? Save it now and decide later.
                    </p>
                </motion.div>
                
                {/* Demo Video - Save links from anywhere */}
                <motion.div
                initial={{ translateY: -20, opacity: 0, rotateZ: 10 }}
                whileInView={{ translateY: 0, opacity: 1, rotateZ: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeInOut", delay: 0.2 }}
                >
                    <div className="flex justify-center">
                        <motion.div 
                        whileHover={{ scale: 1.25, transition: 0.3 }}
                        className="relative rounded-lg border-2 border-[#FFBC42] inline-block
                                        before:content-[''] before:absolute before:inset-0
                                        before:border-8 before:border-[#FFBC42]
                                        before:blur-[10px] before:-z-10                
                        ">
                            <img
                            className="rounded-lg h-100 w-100 mx-auto shadow-lg object-cover"
                            src="/videos/SaveAndViewCart.gif"
                            alt="Chaos in action!"
                            />
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
} 