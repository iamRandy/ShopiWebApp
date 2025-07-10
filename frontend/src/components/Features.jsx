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
        <section id="features" className="relative min-h-screen flex items-center justify-center text-left z-0">
            
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

            <div className="container h-full flex items-center gap-10">
                <div>
                    <h2 className="text-4xl font-bold">Just Save It</h2>
                    <p className="text-stone-400 mt-4 max-w-1xl mx-auto">
                        Found something you love? Save it now and decide later.
                    </p>
                </div>
                <div className="w-full">
                    <motion.img
                    initial={{ translateY: 20, opacity: 0 }}
                    whileInView={{ translateY: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeInOut", delay: 0.5 }}
                    className="border border-stone-300 w-full rounded-xl z-10"
                    src="/videos/SaveFromEverywhere.gif" />
                </div>
            </div>
        </section>
    );
} 