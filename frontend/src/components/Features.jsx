import { Download, CheckCircle, Group } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'react-lottie';
import { useState, useEffect } from 'react';

const FeatureCard = ({ icon, title, description, delay }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div className="relative group">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: delay }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                className="flex flex-col items-center p-6 text-center rounded-lg shadow-md cursor-pointer transition-all duration-300 hover:shadow-lg"
            >
                <div className="p-4 text-stone-400 rounded-full border border-stone-500/20 mb-4">
                    {icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">
                    {title}
                </h3>
            </motion.div>

            {/* Description popup */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, x: -20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.9 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="absolute left-full top-0 ml-4 w-64 p-4 bg-white rounded-lg shadow-xl border border-gray-200 z-10"
                    >
                        <div className="text-sm text-gray-700 leading-relaxed">
                            {description}
                        </div>
                        {/* Arrow pointing to the card */}
                        <div className="absolute left-0 top-6 transform -translate-x-1 w-2 h-2 bg-white rotate-45"></div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function Features() {
    const [animationData, setAnimationData] = useState(null);

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
        <section id="features" className="min-h-screen flex items-center justify-center text-left">
            <div className="container h-full flex items-center gap-10">
                <div>
                    <h2 className="text-4xl font-bold">Just Save It</h2>
                    <p className="text-gray-500 mt-4 max-w-1xl mx-auto">
                        Found something you love? Save it now and decide later.
                    </p>
                </div>
                <div className="w-full">
                    <video
                    className="border border-stone-300 w-full rounded-xl"
                    src="/videos/SaveFromEverywhere.mp4" autoPlay loop muted playsInline />
                </div>
            </div>
        </section>
    );
} 