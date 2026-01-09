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
        <section id="features" className="relative h-screen flex items-center justify-center text-left z-0">
            
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
                <div className="w-full h-full flex items-center">
                    
                    {/* Demo Video - Save links form anywhere */}
                    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                        <iframe 
                        className="absolute top-0 left-0 w-full h-full border border-stone-300 rounded-xl z-10"
                        src="https://www.youtube-nocookie.com/embed/C1BLPX_kJOk?si=N1OVC9KjXQxJgait&controls=0&autoplay=1&mute=1&rel=0&loop=1&playlist=C1BLPX_kJOk"
                        title="YouTube video player" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        referrerPolicy="strict-origin-when-cross-origin" 
                        ></iframe>
                    </div>
                    
                    {/* <motion.img
                    initial={{ translateY: 20, opacity: 0 }}
                    whileInView={{ translateY: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeInOut", delay: 0.5 }}
                    className="border border-stone-300 w-full rounded-xl z-10"
                    src="/videos/SaveFromEverywhere.gif" /> */}
                </div>
            </div>
        </section>
    );
} 